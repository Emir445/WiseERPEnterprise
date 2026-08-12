import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../core/database/prisma.service';
import { CreateFinancialEntryDto } from './dto/create-financial-entry.dto';
import { ListFinancialEntriesQueryDto } from './dto/list-financial-entries-query.dto';
import { SettleFinancialEntryDto } from './dto/settle-financial-entry.dto';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateFinancialEntryDto) {
    const branch = await this.prisma.branch.findFirst({ where: { id: dto.branchId, companyId, deletedAt: null } });
    if (!branch) throw new NotFoundException('Filial não encontrada.');
    if (dto.chartAccountId) await this.ensureChartAccount(companyId, dto.chartAccountId);
    if (dto.costCenterId) await this.ensureCostCenter(companyId, dto.costCenterId);
    return this.prisma.financialEntry.create({
      data: {
        companyId,
        branchId: dto.branchId,
        type: dto.type,
        description: dto.description,
        amount: new Prisma.Decimal(dto.amount),
        dueDate: new Date(dto.dueDate),
        customerId: dto.customerId,
        supplierId: dto.supplierId,
        chartAccountId: dto.chartAccountId,
        costCenterId: dto.costCenterId,
        notes: dto.notes,
        referenceType: 'MANUAL',
      },
      include: this.entryInclude(),
    });
  }

  async findAll(companyId: string, query: ListFinancialEntriesQueryDto) {
    const skip = (query.page - 1) * query.limit;
    const dueDate = query.dueFrom || query.dueTo
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
              { customer: { name: { contains: query.search, mode: 'insensitive' } } },
              { supplier: { name: { contains: query.search, mode: 'insensitive' } } },
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
        include: this.entryInclude(),
      }),
      this.prisma.financialEntry.count({ where }),
    ]);

    return { data, meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
  }

  async findOne(companyId: string, id: string) {
    const entry = await this.prisma.financialEntry.findFirst({
      where: { id, companyId, deletedAt: null },
      include: this.entryInclude(),
    });
    if (!entry) throw new NotFoundException('Lançamento financeiro não encontrado.');
    return entry;
  }

  async settlements(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.financialSettlement.findMany({
      where: { companyId, financialEntryId: id },
      orderBy: { settledAt: 'desc' },
      include: {
        treasuryAccount: true,
        chartAccount: true,
        costCenter: true,
        movement: true,
      },
    });
  }

  async settle(companyId: string, id: string, dto: SettleFinancialEntryDto) {
    const entry = await this.findOne(companyId, id);
    if (entry.status === 'CANCELLED') throw new BadRequestException('Lançamento cancelado não pode ser baixado.');
    if (entry.status === 'PAID') throw new BadRequestException('Lançamento já está totalmente baixado.');

    const amount = new Prisma.Decimal(dto.amount);
    const remaining = entry.amount.sub(entry.paidAmount);
    if (amount.greaterThan(remaining)) throw new BadRequestException('O valor da baixa não pode ser maior que o saldo em aberto.');

    if (dto.chartAccountId) await this.ensureChartAccount(companyId, dto.chartAccountId);
    if (dto.costCenterId) await this.ensureCostCenter(companyId, dto.costCenterId);
    const treasuryAccount = dto.treasuryAccountId
      ? await this.prisma.treasuryAccount.findFirst({ where: { id: dto.treasuryAccountId, companyId, deletedAt: null, status: 'ACTIVE' } })
      : null;
    if (dto.treasuryAccountId && !treasuryAccount) throw new NotFoundException('Conta financeira não encontrada.');

    const paidAmount = entry.paidAmount.add(amount);
    const fullyPaid = paidAmount.equals(entry.amount);

    return this.prisma.$transaction(async (tx) => {
      let movementId: string | undefined;
      const settlement = await tx.financialSettlement.create({
        data: {
          companyId,
          financialEntryId: id,
          treasuryAccountId: treasuryAccount?.id,
          chartAccountId: dto.chartAccountId ?? entry.chartAccountId,
          costCenterId: dto.costCenterId ?? entry.costCenterId,
          amount,
          paymentMethod: dto.paymentMethod,
          notes: dto.notes,
        },
      });

      if (treasuryAccount) {
        const isCredit = entry.type === 'RECEIVABLE';
        const nextBalance = isCredit
          ? treasuryAccount.currentBalance.add(amount)
          : treasuryAccount.currentBalance.sub(amount);
        if (!isCredit && !treasuryAccount.allowNegative && nextBalance.isNegative()) {
          throw new BadRequestException('Saldo insuficiente na conta financeira selecionada.');
        }
        await tx.treasuryAccount.update({ where: { id: treasuryAccount.id }, data: { currentBalance: nextBalance } });
        const movement = await tx.treasuryMovement.create({
          data: {
            companyId,
            branchId: entry.branchId,
            treasuryAccountId: treasuryAccount.id,
            financialSettlementId: settlement.id,
            chartAccountId: dto.chartAccountId ?? entry.chartAccountId,
            costCenterId: dto.costCenterId ?? entry.costCenterId,
            type: isCredit ? 'CREDIT' : 'DEBIT',
            amount,
            balanceBefore: treasuryAccount.currentBalance,
            balanceAfter: nextBalance,
            paymentMethod: dto.paymentMethod,
            description: entry.description,
            referenceType: entry.referenceType ?? 'FINANCIAL_ENTRY',
            referenceId: entry.referenceId ?? entry.id,
            occurredAt: new Date(),
          },
        });
        movementId = movement.id;
      }

      const updated = await tx.financialEntry.update({
        where: { id },
        data: {
          paidAmount,
          status: fullyPaid ? 'PAID' : 'PARTIAL',
          settledAt: fullyPaid ? new Date() : null,
          paymentMethod: dto.paymentMethod,
          chartAccountId: dto.chartAccountId ?? entry.chartAccountId,
          costCenterId: dto.costCenterId ?? entry.costCenterId,
          notes: dto.notes ?? entry.notes,
        },
        include: this.entryInclude(),
      });
      void movementId;
      return updated;
    });
  }

  async cancel(companyId: string, id: string) {
    const entry = await this.findOne(companyId, id);
    if (entry.paidAmount.greaterThan(0)) {
      throw new BadRequestException('Lançamento com baixa financeira não pode ser cancelado diretamente.');
    }
    if (entry.status === 'CANCELLED') return entry;
    return this.prisma.financialEntry.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: this.entryInclude(),
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
      const total = selected.reduce((sum, row) => sum.add(row._sum.amount ?? 0), new Prisma.Decimal(0));
      const paid = selected.reduce((sum, row) => sum.add(row._sum.paidAmount ?? 0), new Prisma.Decimal(0));
      return { total, paid, open: total.sub(paid), count: selected.reduce((sum, row) => sum + row._count._all, 0) };
    };
    const accounts = await this.prisma.treasuryAccount.aggregate({
      where: { companyId, deletedAt: null, status: 'ACTIVE' },
      _sum: { currentBalance: true },
      _count: { _all: true },
    });
    return {
      receivables: normalize('RECEIVABLE'),
      payables: normalize('PAYABLE'),
      treasury: { balance: accounts._sum.currentBalance ?? new Prisma.Decimal(0), accounts: accounts._count._all },
    };
  }

  private entryInclude() {
    return {
      branch: { select: { id: true, name: true, code: true } },
      customer: { select: { id: true, name: true, document: true } },
      supplier: { select: { id: true, name: true, document: true } },
      chartAccount: { select: { id: true, code: true, name: true, nature: true } },
      costCenter: { select: { id: true, code: true, name: true } },
    } as const;
  }

  private async ensureChartAccount(companyId: string, id: string) {
    const row = await this.prisma.chartAccount.findFirst({ where: { id, companyId, deletedAt: null, status: 'ACTIVE' } });
    if (!row) throw new NotFoundException('Conta contábil não encontrada.');
    return row;
  }

  private async ensureCostCenter(companyId: string, id: string) {
    const row = await this.prisma.costCenter.findFirst({ where: { id, companyId, deletedAt: null, status: 'ACTIVE' } });
    if (!row) throw new NotFoundException('Centro de custo não encontrado.');
    return row;
  }
}
