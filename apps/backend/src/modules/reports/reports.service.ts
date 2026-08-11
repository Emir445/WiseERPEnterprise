import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../core/database/prisma.service';
import { OperationsReportQueryDto } from './dto/operations-report-query.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(companyId: string, query: OperationsReportQueryDto) {
    const dateRange =
      query.from || query.to
        ? {
            ...(query.from ? { gte: new Date(query.from) } : {}),
            ...(query.to
              ? {
                  lte: new Date(
                    `${query.to.slice(0, 10)}T23:59:59.999Z`,
                  ),
                }
              : {}),
          }
        : undefined;

    const common = {
      companyId,
      deletedAt: null,
      ...(query.branchId ? { branchId: query.branchId } : {}),
      ...(dateRange ? { issueDate: dateRange } : {}),
    };

    const [sales, purchases, financialRows, balances] =
      await Promise.all([
        this.prisma.sale.aggregate({
          where: { ...common, status: 'CONFIRMED' },
          _sum: { totalAmount: true },
          _count: { _all: true },
        }),
        this.prisma.purchase.aggregate({
          where: { ...common, status: 'CONFIRMED' },
          _sum: { totalAmount: true },
          _count: { _all: true },
        }),
        this.prisma.financialEntry.groupBy({
          by: ['type', 'status'],
          where: {
            companyId,
            deletedAt: null,
            ...(query.branchId ? { branchId: query.branchId } : {}),
            ...(query.from || query.to
              ? {
                  createdAt: {
                    ...(query.from ? { gte: new Date(query.from) } : {}),
                    ...(query.to
                      ? {
                          lte: new Date(
                            `${query.to.slice(0, 10)}T23:59:59.999Z`,
                          ),
                        }
                      : {}),
                  },
                }
              : {}),
          },
          _sum: { amount: true, paidAmount: true },
          _count: { _all: true },
        }),
        this.prisma.inventoryBalance.findMany({
          where: {
            companyId,
            ...(query.branchId ? { branchId: query.branchId } : {}),
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                costPrice: true,
                minimumStock: true,
              },
            },
            branch: {
              select: { id: true, name: true, code: true },
            },
          },
        }),
      ]);

    const financial = (type: 'RECEIVABLE' | 'PAYABLE') => {
      const rows = financialRows.filter(
        (row) => row.type === type && row.status !== 'CANCELLED',
      );
      const total = rows.reduce(
        (sum, row) => sum.add(row._sum.amount ?? 0),
        new Prisma.Decimal(0),
      );
      const paid = rows.reduce(
        (sum, row) => sum.add(row._sum.paidAmount ?? 0),
        new Prisma.Decimal(0),
      );
      return {
        total,
        paid,
        open: total.sub(paid),
        count: rows.reduce((sum, row) => sum + row._count._all, 0),
      };
    };

    const inventoryValue = balances.reduce(
      (sum, balance) =>
        sum.add(balance.quantity.mul(balance.product.costPrice)),
      new Prisma.Decimal(0),
    );

    const lowStock = balances.filter((balance) =>
      balance.available.lessThanOrEqualTo(
        balance.product.minimumStock,
      ),
    );

    return {
      period: {
        from: query.from ?? null,
        to: query.to ?? null,
        branchId: query.branchId ?? null,
      },
      sales: {
        count: sales._count._all,
        total: sales._sum.totalAmount ?? new Prisma.Decimal(0),
      },
      purchases: {
        count: purchases._count._all,
        total: purchases._sum.totalAmount ?? new Prisma.Decimal(0),
      },
      finance: {
        receivables: financial('RECEIVABLE'),
        payables: financial('PAYABLE'),
      },
      inventory: {
        balances: balances.length,
        valueAtCost: inventoryValue,
        lowStockCount: lowStock.length,
      },
    };
  }

  async lowStock(companyId: string, branchId?: string) {
    const balances = await this.prisma.inventoryBalance.findMany({
      where: {
        companyId,
        ...(branchId ? { branchId } : {}),
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            unit: true,
            minimumStock: true,
          },
        },
      },
      orderBy: { updatedAt: 'asc' },
    });

    return balances.filter((balance) =>
      balance.available.lessThanOrEqualTo(balance.product.minimumStock),
    );
  }
}
