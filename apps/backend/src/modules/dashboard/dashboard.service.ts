import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../core/database/prisma.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(companyId: string, query: DashboardQueryDto) {
    const from = new Date();
    from.setDate(from.getDate() - query.days);
    from.setHours(0, 0, 0, 0);

    const common = {
      companyId,
      ...(query.branchId ? { branchId: query.branchId } : {}),
    };

    const [sales, purchases, finance, balances] = await Promise.all([
      this.prisma.sale.aggregate({
        where: {
          ...common,
          status: 'CONFIRMED',
          deletedAt: null,
          issueDate: { gte: from },
        },
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
      this.prisma.purchase.aggregate({
        where: {
          ...common,
          status: 'CONFIRMED',
          deletedAt: null,
          issueDate: { gte: from },
        },
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
      this.prisma.financialEntry.groupBy({
        by: ['type'],
        where: {
          ...common,
          deletedAt: null,
          status: { in: ['OPEN', 'PARTIAL'] },
        },
        _sum: { amount: true, paidAmount: true },
        _count: { _all: true },
      }),
      this.prisma.inventoryBalance.findMany({
        where: common,
        include: {
          branch: { select: { id: true, name: true, code: true } },
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              minimumStock: true,
              unit: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 2000,
      }),
    ]);

    const financial = (type: 'RECEIVABLE' | 'PAYABLE') => {
      const row = finance.find((item) => item.type === type);
      const total = new Prisma.Decimal(row?._sum.amount ?? 0);
      const paid = new Prisma.Decimal(row?._sum.paidAmount ?? 0);
      return {
        total,
        paid,
        open: total.sub(paid),
        count: row?._count._all ?? 0,
      };
    };

    const lowStock = balances
      .filter((balance) =>
        balance.available.lessThanOrEqualTo(balance.product.minimumStock),
      )
      .map((balance) => ({
        branch: balance.branch,
        product: balance.product,
        quantity: balance.quantity,
        reserved: balance.reserved,
        available: balance.available,
      }));

    return {
      period: { from, to: new Date(), days: query.days },
      sales: {
        count: sales._count._all,
        total: sales._sum.totalAmount ?? new Prisma.Decimal(0),
      },
      purchases: {
        count: purchases._count._all,
        total: purchases._sum.totalAmount ?? new Prisma.Decimal(0),
      },
      receivables: financial('RECEIVABLE'),
      payables: financial('PAYABLE'),
      inventory: {
        balances: balances.length,
        lowStockCount: lowStock.length,
        lowStock,
      },
    };
  }
}
