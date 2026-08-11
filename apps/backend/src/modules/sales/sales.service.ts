import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../core/database/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { ListSalesQueryDto } from './dto/list-sales-query.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateSaleDto) {
    const existing = await this.prisma.sale.findFirst({
      where: { companyId, number: dto.number, deletedAt: null },
    });

    if (existing) {
      throw new ConflictException('Já existe uma venda com este número.');
    }

    await this.validateEntities(
      companyId,
      dto.branchId,
      dto.customerId,
      dto.items.map((item) => item.productId),
    );

    const items = this.buildItems(dto.items);
    const totalAmount = items.reduce(
      (total, item) => total.add(item.totalAmount),
      new Prisma.Decimal(0),
    );

    return this.prisma.sale.create({
      data: {
        companyId,
        branchId: dto.branchId,
        customerId: dto.customerId,
        number: dto.number,
        notes: dto.notes,
        totalAmount,
        items: { create: items },
      },
      include: this.includeRelations(),
    });
  }

  async findAll(companyId: string, query: ListSalesQueryDto) {
    const skip = (query.page - 1) * query.limit;
    const where: Prisma.SaleWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.branchId ? { branchId: query.branchId } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { number: { contains: query.search, mode: 'insensitive' } },
              {
                customer: {
                  name: { contains: query.search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.sale.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: this.includeRelations(),
      }),
      this.prisma.sale.count({ where }),
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
    const sale = await this.prisma.sale.findFirst({
      where: { id, companyId, deletedAt: null },
      include: this.includeRelations(),
    });

    if (!sale) {
      throw new NotFoundException('Venda não encontrada.');
    }

    return sale;
  }

  async update(companyId: string, id: string, dto: UpdateSaleDto) {
    const sale = await this.findOne(companyId, id);

    if (sale.status !== 'DRAFT') {
      throw new BadRequestException(
        'Somente vendas em rascunho podem ser alteradas.',
      );
    }

    if (dto.number && dto.number !== sale.number) {
      const duplicate = await this.prisma.sale.findFirst({
        where: {
          companyId,
          number: dto.number,
          deletedAt: null,
          id: { not: id },
        },
      });
      if (duplicate) {
        throw new ConflictException('Já existe outra venda com este número.');
      }
    }

    const branchId = dto.branchId ?? sale.branchId;
    const customerId = dto.customerId ?? sale.customerId;
    const nextItems =
      dto.items ??
      sale.items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discountAmount: Number(item.discountAmount),
      }));

    await this.validateEntities(
      companyId,
      branchId,
      customerId,
      nextItems.map((item) => item.productId),
    );

    const items = this.buildItems(nextItems);
    const totalAmount = items.reduce(
      (total, item) => total.add(item.totalAmount),
      new Prisma.Decimal(0),
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.saleItem.deleteMany({ where: { saleId: id } });
      return tx.sale.update({
        where: { id },
        data: {
          branchId,
          customerId,
          number: dto.number ?? sale.number,
          notes: dto.notes !== undefined ? dto.notes : sale.notes,
          totalAmount,
          items: { create: items },
        },
        include: this.includeRelations(),
      });
    });
  }

  async confirm(companyId: string, id: string) {
    const sale = await this.findOne(companyId, id);

    if (sale.status !== 'DRAFT') {
      throw new BadRequestException('A venda já foi processada.');
    }

    return this.prisma.$transaction(async (tx) => {
      for (const item of sale.items) {
        const balance = await tx.inventoryBalance.findUnique({
          where: {
            branchId_productId: {
              branchId: sale.branchId,
              productId: item.productId,
            },
          },
        });

        if (!balance) {
          throw new BadRequestException(
            `Produto ${item.product.name} sem estoque nesta filial.`,
          );
        }

        if (balance.available.lessThan(item.quantity)) {
          throw new BadRequestException(
            `Estoque insuficiente para o produto ${item.product.name}.`,
          );
        }

        const previousQty = balance.quantity;
        const currentQty = previousQty.sub(item.quantity);
        const available = balance.available.sub(item.quantity);

        await tx.inventoryBalance.update({
          where: { id: balance.id },
          data: { quantity: currentQty, available },
        });

        await tx.inventoryMovement.create({
          data: {
            companyId,
            branchId: sale.branchId,
            productId: item.productId,
            type: 'EXIT',
            quantity: item.quantity,
            previousQty,
            currentQty,
            referenceType: 'SALE',
            referenceId: sale.id,
            notes: `Saída da venda ${sale.number}`,
          },
        });
      }

      await tx.financialEntry.create({
        data: {
          companyId,
          branchId: sale.branchId,
          customerId: sale.customerId,
          type: 'RECEIVABLE',
          status: 'OPEN',
          description: `Venda ${sale.number}`,
          amount: sale.totalAmount,
          dueDate: new Date(),
          referenceType: 'SALE',
          referenceId: sale.id,
        },
      });

      return tx.sale.update({
        where: { id },
        data: { status: 'CONFIRMED' },
        include: this.includeRelations(),
      });
    });
  }

  async cancel(companyId: string, id: string) {
    const sale = await this.findOne(companyId, id);

    if (sale.status === 'CANCELLED') {
      return sale;
    }

    if (sale.status === 'DRAFT') {
      return this.prisma.sale.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: this.includeRelations(),
      });
    }

    const financialEntry = await this.prisma.financialEntry.findFirst({
      where: {
        companyId,
        referenceType: 'SALE',
        referenceId: sale.id,
        type: 'RECEIVABLE',
        deletedAt: null,
      },
    });

    if (financialEntry?.paidAmount.greaterThan(0)) {
      throw new BadRequestException(
        'Venda com recebimento financeiro não pode ser cancelada diretamente.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      for (const item of sale.items) {
        const balance = await tx.inventoryBalance.findUnique({
          where: {
            branchId_productId: {
              branchId: sale.branchId,
              productId: item.productId,
            },
          },
        });

        const previousQty = balance?.quantity ?? new Prisma.Decimal(0);
        const reserved = balance?.reserved ?? new Prisma.Decimal(0);
        const currentQty = previousQty.add(item.quantity);
        const available = currentQty.sub(reserved);

        await tx.inventoryBalance.upsert({
          where: {
            branchId_productId: {
              branchId: sale.branchId,
              productId: item.productId,
            },
          },
          update: { quantity: currentQty, available },
          create: {
            companyId,
            branchId: sale.branchId,
            productId: item.productId,
            quantity: currentQty,
            reserved,
            available,
          },
        });

        await tx.inventoryMovement.create({
          data: {
            companyId,
            branchId: sale.branchId,
            productId: item.productId,
            type: 'ENTRY',
            quantity: item.quantity,
            previousQty,
            currentQty,
            referenceType: 'SALE_CANCEL',
            referenceId: sale.id,
            notes: `Estorno da venda ${sale.number}`,
          },
        });
      }

      if (financialEntry) {
        await tx.financialEntry.update({
          where: { id: financialEntry.id },
          data: { status: 'CANCELLED' },
        });
      }

      return tx.sale.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: this.includeRelations(),
      });
    });
  }

  private buildItems(
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      discountAmount?: number;
    }>,
  ) {
    return items.map((item) => {
      const quantity = new Prisma.Decimal(item.quantity);
      const unitPrice = new Prisma.Decimal(item.unitPrice);
      const discount = new Prisma.Decimal(item.discountAmount ?? 0);
      const gross = quantity.mul(unitPrice);

      if (discount.greaterThan(gross)) {
        throw new BadRequestException(
          'O desconto não pode ser maior que o valor do item.',
        );
      }

      return {
        productId: item.productId,
        quantity,
        unitPrice,
        discountAmount: discount,
        totalAmount: gross.sub(discount),
      };
    });
  }

  private includeRelations() {
    return {
      customer: true,
      branch: true,
      items: { include: { product: true } },
    } as const;
  }

  private async validateEntities(
    companyId: string,
    branchId: string,
    customerId: string,
    productIds: string[],
  ) {
    const [branch, customer, products] = await Promise.all([
      this.prisma.branch.findFirst({
        where: { id: branchId, companyId, deletedAt: null },
      }),
      this.prisma.customer.findFirst({
        where: {
          id: customerId,
          companyId,
          deletedAt: null,
          status: 'ACTIVE',
        },
      }),
      this.prisma.product.findMany({
        where: {
          id: { in: productIds },
          companyId,
          deletedAt: null,
          status: 'ACTIVE',
        },
      }),
    ]);

    if (!branch) throw new NotFoundException('Filial não encontrada.');
    if (!customer) throw new NotFoundException('Cliente não encontrado.');
    if (products.length !== new Set(productIds).size) {
      throw new NotFoundException(
        'Um ou mais produtos não foram encontrados.',
      );
    }
  }
}
