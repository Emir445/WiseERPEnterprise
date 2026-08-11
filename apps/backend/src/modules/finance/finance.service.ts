import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../core/database/prisma.service';
import { ListFinancialEntriesQueryDto } from './dto/list-financial-entries-query.dto';
import { SettleFinancialEntryDto } from './dto/settle-financial-entry.dto';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, query: ListFinancialEntriesQueryDto) {
    const skip = (query.page - 1) * query.limit;
    const dueDate =
      query.dueFrom || query.dueTo
        ? {
            ...(query.dueFrom ? { gte: new Date(query.dueFrom) } : {}),
            ...(query.dueTo ? { lte: new Date(query.dueTo) } : {}),
          }
        : undefined;

    const where: Prisma.FinancialEntryWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.branchId ? { branchId: query.branchId } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.supplierId ? { supplierId: query.supplierId } : {}),
      ...(dueDate ? { dueDate } : {}),
      ...(query.search
        ? {
            OR: [
              { description: { contains: query.search, mode: 'insensitive' } },
              { referenceId: { contains: query.search, mode: 'insensitive' } },
              {
                customer: {
                  name: { contains: query.search, mode: 'insensitive' },
                },
              },
              {
                supplier: {
                  name: { contains: query.search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.financialEntry.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        include: {
          branch: { select: { id: true, name: true, code: true } },
          customer: { select: { id: true, name: true, document: true } },
          supplier: { select: { id: true, name: true, document: true } },
        },
      }),
      this.prisma.financialEntry.count({ where }),
    ]);

    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(companyId: string, id: string) {
    const entry = await this.prisma.financialEntry.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { branch: true, customer: true, supplier: true },
    });

    if (!entry) {
      throw new NotFoundException('Lançamento financeiro não encontrado.');
    }

    return entry;
  }

  async settle(companyId: string, id: string, dto: SettleFinancialEntryDto) {
    const entry = await this.findOne(companyId, id);

    if (entry.status === 'CANCELLED') {
      throw new BadRequestException('Lançamento cancelado não pode ser baixado.');
    }
    if (entry.status === 'PAID') {
      throw new BadRequestException('Lançamento já está totalmente baixado.');
    }

    const amount = new Prisma.Decimal(dto.amount);
    const remaining = entry.amount.sub(entry.paidAmount);
    if (amount.greaterThan(remaining)) {
      throw new BadRequestException(
        'O valor da baixa não pode ser maior que o saldo em aberto.',
      );
    }

    const paidAmount = entry.paidAmount.add(amount);
    const fullyPaid = paidAmount.equals(entry.amount);

    return this.prisma.financialEntry.update({
      where: { id },
      data: {
        paidAmount,
        status: fullyPaid ? 'PAID' : 'PARTIAL',
        settledAt: fullyPaid ? new Date() : null,
        paymentMethod: dto.paymentMethod,
        notes: dto.notes ?? entry.notes,
      },
      include: { branch: true, customer: true, supplier: true },
    });
  }

  async cancel(companyId: string, id: string) {
    const entry = await this.findOne(companyId, id);

    if (entry.paidAmount.greaterThan(0)) {
      throw new BadRequestException(
        'Lançamento com baixa financeira não pode ser cancelado diretamente.',
      );
    }

    if (entry.status === 'CANCELLED') return entry;

    return this.prisma.financialEntry.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { branch: true, customer: true, supplier: true },
    });
  }

  async summary(companyId: string) {
    const rows = await this.prisma.financialEntry.groupBy({
      by: ['type', 'status'],
      where: { companyId, deletedAt: null, status: { not: 'CANCELLED' } },
      _sum: { amount: true, paidAmount: true },
      _count: { _all: true },
    });

    const normalize = (type: 'RECEIVABLE' | 'PAYABLE') => {
      const selected = rows.filter((row) => row.type === type);
      const total = selected.reduce(
        (sum, row) => sum.add(row._sum.amount ?? 0),
        new Prisma.Decimal(0),
      );
      const paid = selected.reduce(
        (sum, row) => sum.add(row._sum.paidAmount ?? 0),
        new Prisma.Decimal(0),
      );
      return {
        total,
        paid,
        open: total.sub(paid),
        count: selected.reduce((sum, row) => sum + row._count._all, 0),
      };
    };

    return {
      receivables: normalize('RECEIVABLE'),
      payables: normalize('PAYABLE'),
    };
  }
}
