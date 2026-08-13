import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { SalesService } from './sales.service';

describe('SalesService - integridade de confirmação', () => {
  const companyId = 'company-1';

  function makeSale(overrides: Record<string, unknown> = {}) {
    return {
      id: 'sale-1',
      companyId,
      branchId: 'branch-1',
      customerId: 'customer-1',
      paymentTermId: 'term-1',
      number: 'VENDA-001',
      status: 'DRAFT',
      totalAmount: new Prisma.Decimal('100.00'),
      items: [
        {
          productId: 'product-1',
          quantity: new Prisma.Decimal('2'),
          unitPrice: new Prisma.Decimal('50'),
          discountAmount: new Prisma.Decimal('0'),
          totalAmount: new Prisma.Decimal('100'),
          product: { name: 'Produto Teste' },
        },
      ],
      ...overrides,
    };
  }

  function setup(sale = makeSale()) {
    const tx = {
      inventoryBalance: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'balance-1',
          quantity: new Prisma.Decimal('10'),
          reserved: new Prisma.Decimal('0'),
          available: new Prisma.Decimal('10'),
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      inventoryMovement: {
        create: jest.fn().mockResolvedValue({}),
      },
      paymentTerm: {
        findFirst: jest.fn().mockResolvedValue({
          installments: 2,
          firstDueDays: 0,
          intervalDays: 30,
        }),
      },
      financialEntry: {
        create: jest.fn().mockResolvedValue({}),
      },
      sale: {
        update: jest.fn().mockResolvedValue({
          ...sale,
          status: 'CONFIRMED',
        }),
      },
    };

    const prisma = {
      sale: {
        findFirst: jest.fn().mockResolvedValue(sale),
      },
      $transaction: jest.fn(async (callback: (client: any) => unknown) =>
        callback(tx),
      ),
    };

    const service = new SalesService(prisma as any);

    return { service, prisma, tx };
  }

  it('deve baixar estoque, registrar movimento e gerar contas a receber', async () => {
    const { service, tx } = setup();

    const result = await service.confirm(companyId, 'sale-1');

    expect(tx.inventoryBalance.update).toHaveBeenCalledTimes(1);

    const stockUpdate = tx.inventoryBalance.update.mock.calls[0][0];
    expect(stockUpdate.data.quantity.toString()).toBe('8');
    expect(stockUpdate.data.available.toString()).toBe('8');

    expect(tx.inventoryMovement.create).toHaveBeenCalledTimes(1);
    expect(tx.financialEntry.create).toHaveBeenCalledTimes(2);

    const firstInstallment =
      tx.financialEntry.create.mock.calls[0][0].data.amount;
    const secondInstallment =
      tx.financialEntry.create.mock.calls[1][0].data.amount;

    expect(firstInstallment.toString()).toBe('50');
    expect(secondInstallment.toString()).toBe('50');

    expect(tx.sale.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sale-1' },
        data: { status: 'CONFIRMED' },
      }),
    );

    expect(result.status).toBe('CONFIRMED');
  });

  it('não deve confirmar venda quando o estoque for insuficiente', async () => {
    const { service, tx } = setup();

    tx.inventoryBalance.findUnique.mockResolvedValueOnce({
      id: 'balance-1',
      quantity: new Prisma.Decimal('1'),
      reserved: new Prisma.Decimal('0'),
      available: new Prisma.Decimal('1'),
    });

    await expect(service.confirm(companyId, 'sale-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(tx.inventoryBalance.update).not.toHaveBeenCalled();
    expect(tx.inventoryMovement.create).not.toHaveBeenCalled();
    expect(tx.financialEntry.create).not.toHaveBeenCalled();
    expect(tx.sale.update).not.toHaveBeenCalled();
  });

  it('não deve processar novamente uma venda já confirmada', async () => {
    const { service, prisma } = setup(
      makeSale({ status: 'CONFIRMED' }),
    );

    await expect(service.confirm(companyId, 'sale-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
