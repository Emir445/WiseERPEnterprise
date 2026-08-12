import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../core/database/prisma.service';
import { AdjustTreasuryAccountDto } from './dto/adjust-treasury-account.dto';
import { CashFlowQueryDto } from './dto/cash-flow-query.dto';
import { CloseCashSessionDto } from './dto/close-cash-session.dto';
import { CreateTreasuryAccountDto } from './dto/create-treasury-account.dto';
import { CreateTreasuryTransferDto } from './dto/create-treasury-transfer.dto';
import { ListTreasuryMovementsQueryDto } from './dto/list-treasury-movements-query.dto';
import { OpenCashSessionDto } from './dto/open-cash-session.dto';
import { ReconcileTreasuryMovementsDto } from './dto/reconcile-treasury-movements.dto';
import { UpdateTreasuryAccountDto } from './dto/update-treasury-account.dto';

@Injectable()
export class TreasuryService {
  constructor(private readonly prisma: PrismaService) {}

  async createAccount(companyId: string, dto: CreateTreasuryAccountDto) {
    const duplicate = await this.prisma.treasuryAccount.findFirst({
      where: { companyId, name: dto.name, deletedAt: null },
    });
    if (duplicate) throw new ConflictException('Já existe uma conta financeira com este nome.');

    if (dto.branchId) await this.ensureBranch(companyId, dto.branchId);

    const opening = new Prisma.Decimal(dto.openingBalance ?? 0);
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.treasuryAccount.create({
        data: {
          companyId,
          branchId: dto.branchId,
          name: dto.name,
          type: dto.type,
          bankName: dto.bankName,
          agency: dto.agency,
          accountNumber: dto.accountNumber,
          currentBalance: opening,
          allowNegative: dto.allowNegative ?? false,
        },
      });

      if (!opening.isZero()) {
        await tx.treasuryMovement.create({
          data: {
            companyId,
            branchId: dto.branchId,
            treasuryAccountId: account.id,
            type: 'ADJUSTMENT',
            amount: opening,
            balanceBefore: new Prisma.Decimal(0),
            balanceAfter: opening,
            description: 'Saldo inicial da conta',
            referenceType: 'OPENING_BALANCE',
          },
        });
      }
      return account;
    });
  }

  findAccounts(companyId: string) {
    return this.prisma.treasuryAccount.findMany({
      where: { companyId, deletedAt: null },
      include: { branch: { select: { id: true, name: true, code: true } } },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  async findAccount(companyId: string, id: string) {
    const account = await this.prisma.treasuryAccount.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { branch: true },
    });
    if (!account) throw new NotFoundException('Conta financeira não encontrada.');
    return account;
  }

  async updateAccount(companyId: string, id: string, dto: UpdateTreasuryAccountDto) {
    const current = await this.findAccount(companyId, id);
    if (dto.branchId) await this.ensureBranch(companyId, dto.branchId);
    if (dto.name && dto.name !== current.name) {
      const duplicate = await this.prisma.treasuryAccount.findFirst({
        where: { companyId, name: dto.name, id: { not: id }, deletedAt: null },
      });
      if (duplicate) throw new ConflictException('Já existe outra conta financeira com este nome.');
    }
    const { openingBalance: _openingBalance, ...data } = dto;
    return this.prisma.treasuryAccount.update({ where: { id }, data });
  }

  async removeAccount(companyId: string, id: string) {
    const account = await this.findAccount(companyId, id);
    if (!account.currentBalance.isZero()) {
      throw new BadRequestException('Zere o saldo da conta antes de inativá-la.');
    }
    return this.prisma.treasuryAccount.update({
      where: { id },
      data: { status: 'INACTIVE', deletedAt: new Date() },
    });
  }

  async adjustAccount(companyId: string, id: string, dto: AdjustTreasuryAccountDto) {
    const account = await this.findAccount(companyId, id);
    const newBalance = new Prisma.Decimal(dto.newBalance);
    const difference = newBalance.sub(account.currentBalance);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.treasuryAccount.update({
        where: { id },
        data: { currentBalance: newBalance },
      });
      await tx.treasuryMovement.create({
        data: {
          companyId,
          branchId: account.branchId,
          treasuryAccountId: id,
          type: 'ADJUSTMENT',
          amount: difference.abs(),
          balanceBefore: account.currentBalance,
          balanceAfter: newBalance,
          description: 'Ajuste manual de saldo',
          referenceType: 'MANUAL_ADJUSTMENT',
        },
      });
      return updated;
    });
  }

  async transfer(companyId: string, dto: CreateTreasuryTransferDto) {
    if (dto.fromAccountId === dto.toAccountId) {
      throw new BadRequestException('As contas de origem e destino devem ser diferentes.');
    }
    const [from, to] = await Promise.all([
      this.findAccount(companyId, dto.fromAccountId),
      this.findAccount(companyId, dto.toAccountId),
    ]);
    const amount = new Prisma.Decimal(dto.amount);
    const fromAfter = from.currentBalance.sub(amount);
    if (!from.allowNegative && fromAfter.isNegative()) {
      throw new BadRequestException('Saldo insuficiente na conta de origem.');
    }
    const toAfter = to.currentBalance.add(amount);
    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();

    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.treasuryTransfer.create({
        data: {
          companyId,
          fromAccountId: from.id,
          toAccountId: to.id,
          amount,
          occurredAt,
          notes: dto.notes,
        },
      });
      await tx.treasuryAccount.update({ where: { id: from.id }, data: { currentBalance: fromAfter } });
      await tx.treasuryAccount.update({ where: { id: to.id }, data: { currentBalance: toAfter } });
      await tx.treasuryMovement.createMany({
        data: [
          {
            companyId,
            branchId: from.branchId,
            treasuryAccountId: from.id,
            treasuryTransferId: transfer.id,
            type: 'TRANSFER_OUT',
            amount,
            balanceBefore: from.currentBalance,
            balanceAfter: fromAfter,
            description: `Transferência para ${to.name}`,
            referenceType: 'TREASURY_TRANSFER',
            referenceId: transfer.id,
            occurredAt,
          },
          {
            companyId,
            branchId: to.branchId,
            treasuryAccountId: to.id,
            treasuryTransferId: transfer.id,
            type: 'TRANSFER_IN',
            amount,
            balanceBefore: to.currentBalance,
            balanceAfter: toAfter,
            description: `Transferência de ${from.name}`,
            referenceType: 'TREASURY_TRANSFER',
            referenceId: transfer.id,
            occurredAt,
          },
        ],
      });
      return tx.treasuryTransfer.findUnique({
        where: { id: transfer.id },
        include: { fromAccount: true, toAccount: true, movements: true },
      });
    });
  }

  async movements(companyId: string, query: ListTreasuryMovementsQueryDto) {
    const skip = (query.page - 1) * query.limit;
    const occurredAt = query.from || query.to
      ? {
          ...(query.from ? { gte: new Date(query.from) } : {}),
          ...(query.to ? { lte: new Date(query.to) } : {}),
        }
      : undefined;
    const where: Prisma.TreasuryMovementWhereInput = {
      companyId,
      ...(query.accountId ? { treasuryAccountId: query.accountId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(occurredAt ? { occurredAt } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.treasuryMovement.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { occurredAt: 'desc' },
        include: {
          treasuryAccount: { select: { id: true, name: true, type: true } },
          chartAccount: { select: { id: true, code: true, name: true } },
          costCenter: { select: { id: true, code: true, name: true } },
        },
      }),
      this.prisma.treasuryMovement.count({ where }),
    ]);
    return { data, meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
  }

  async reconcile(companyId: string, dto: ReconcileTreasuryMovementsDto) {
    const found = await this.prisma.treasuryMovement.count({
      where: { companyId, id: { in: dto.movementIds } },
    });
    if (found !== new Set(dto.movementIds).size) {
      throw new NotFoundException('Uma ou mais movimentações não foram encontradas.');
    }
    const now = new Date();
    await this.prisma.treasuryMovement.updateMany({
      where: { companyId, id: { in: dto.movementIds } },
      data: { reconciledAt: now, reconciliationReference: dto.reference },
    });
    return { reconciled: dto.movementIds.length, reconciledAt: now, reference: dto.reference ?? null };
  }

  async openCashSession(companyId: string, userId: string, dto: OpenCashSessionDto) {
    await this.ensureBranch(companyId, dto.branchId);
    const account = await this.findAccount(companyId, dto.treasuryAccountId);
    if (account.type !== 'CASH') throw new BadRequestException('A abertura de caixa exige uma conta do tipo CASH.');
    const existing = await this.prisma.cashSession.findFirst({
      where: { companyId, treasuryAccountId: account.id, status: 'OPEN' },
    });
    if (existing) throw new ConflictException('Já existe um caixa aberto para esta conta.');

    return this.prisma.cashSession.create({
      data: {
        companyId,
        branchId: dto.branchId,
        treasuryAccountId: account.id,
        openingAmount: new Prisma.Decimal(dto.openingAmount),
        openedByUserId: userId,
        notes: dto.notes,
      },
      include: { treasuryAccount: true, branch: true },
    });
  }

  async closeCashSession(companyId: string, userId: string, id: string, dto: CloseCashSessionDto) {
    const session = await this.prisma.cashSession.findFirst({
      where: { id, companyId, status: 'OPEN' },
      include: { treasuryAccount: true },
    });
    if (!session) throw new NotFoundException('Caixa aberto não encontrado.');
    const expected = session.treasuryAccount.currentBalance;
    const actual = new Prisma.Decimal(dto.actualClosingAmount);
    return this.prisma.cashSession.update({
      where: { id },
      data: {
        status: 'CLOSED',
        expectedClosingAmount: expected,
        actualClosingAmount: actual,
        difference: actual.sub(expected),
        closedByUserId: userId,
        closedAt: new Date(),
        notes: dto.notes ?? session.notes,
      },
      include: { treasuryAccount: true, branch: true },
    });
  }

  findCashSessions(companyId: string) {
    return this.prisma.cashSession.findMany({
      where: { companyId },
      orderBy: { openedAt: 'desc' },
      include: { treasuryAccount: true, branch: true },
      take: 100,
    });
  }

  async cashFlow(companyId: string, query: CashFlowQueryDto) {
    const occurredAt = query.from || query.to
      ? {
          ...(query.from ? { gte: new Date(query.from) } : {}),
          ...(query.to ? { lte: new Date(query.to) } : {}),
        }
      : undefined;
    const rows = await this.prisma.treasuryMovement.findMany({
      where: {
        companyId,
        ...(query.accountId ? { treasuryAccountId: query.accountId } : {}),
        ...(occurredAt ? { occurredAt } : {}),
      },
      orderBy: { occurredAt: 'asc' },
      include: { treasuryAccount: { select: { id: true, name: true } } },
    });
    const credits = rows.filter((r) => ['CREDIT', 'TRANSFER_IN'].includes(r.type)).reduce((s, r) => s.add(r.amount), new Prisma.Decimal(0));
    const debits = rows.filter((r) => ['DEBIT', 'TRANSFER_OUT'].includes(r.type)).reduce((s, r) => s.add(r.amount), new Prisma.Decimal(0));
    return { credits, debits, net: credits.sub(debits), movements: rows };
  }

  private async ensureBranch(companyId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, companyId, deletedAt: null } });
    if (!branch) throw new NotFoundException('Filial não encontrada.');
    return branch;
  }
}
