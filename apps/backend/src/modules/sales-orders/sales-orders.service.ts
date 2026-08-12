import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { ListSalesOrdersQueryDto } from './dto/list-sales-orders-query.dto';

@Injectable()
export class SalesOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private include() {
    return {
      branch: true,
      customer: true,
      paymentTerm: true,
      quote: true,
      sale: true,
      shipments: { include: { carrier: true, items: true } },
      items: { include: { product: true } },
    } as const;
  }

  private mapItems(items: CreateSalesOrderDto['items']) {
    return items.map((item) => {
      const quantity = new Prisma.Decimal(item.quantity);
      const unitPrice = new Prisma.Decimal(item.unitPrice);
      const discount = new Prisma.Decimal(item.discountAmount ?? 0);
      const gross = quantity.mul(unitPrice);
      if (discount.gt(gross)) throw new BadRequestException('Desconto maior que o item.');
      return { productId: item.productId, quantity, unitPrice, discountAmount: discount, totalAmount: gross.sub(discount) };
    });
  }

  async create(companyId: string, dto: CreateSalesOrderDto) {
    if (await this.prisma.salesOrder.findFirst({ where: { companyId, number: dto.number, deletedAt: null } })) {
      throw new ConflictException('Número de pedido já existe.');
    }
    const [branch, customer, paymentTerm, products] = await Promise.all([
      this.prisma.branch.findFirst({ where: { id: dto.branchId, companyId, deletedAt: null } }),
      this.prisma.customer.findFirst({ where: { id: dto.customerId, companyId, status: 'ACTIVE', deletedAt: null } }),
      dto.paymentTermId ? this.prisma.paymentTerm.findFirst({ where: { id: dto.paymentTermId, companyId, status: 'ACTIVE', deletedAt: null } }) : Promise.resolve(true),
      this.prisma.product.findMany({ where: { id: { in: dto.items.map((i) => i.productId) }, companyId, status: 'ACTIVE', deletedAt: null } }),
    ]);
    if (!branch || !customer || !paymentTerm || products.length !== new Set(dto.items.map((i) => i.productId)).size) {
      throw new NotFoundException('Filial, cliente, condição ou produto inválido.');
    }
    const items = this.mapItems(dto.items);
    const totalAmount = items.reduce((total, item) => total.add(item.totalAmount), new Prisma.Decimal(0));
    return this.prisma.salesOrder.create({
      data: { companyId, branchId: dto.branchId, customerId: dto.customerId, paymentTermId: dto.paymentTermId, number: dto.number, notes: dto.notes, totalAmount, items: { create: items } },
      include: this.include(),
    });
  }

  async all(companyId: string, query: ListSalesOrdersQueryDto) {
    const where: Prisma.SalesOrderWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search ? { number: { contains: query.search, mode: 'insensitive' } } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.salesOrder.findMany({ where, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: { createdAt: 'desc' }, include: this.include() }),
      this.prisma.salesOrder.count({ where }),
    ]);
    return { data, meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
  }

  async one(companyId: string, id: string) {
    const order = await this.prisma.salesOrder.findFirst({ where: { id, companyId, deletedAt: null }, include: this.include() });
    if (!order) throw new NotFoundException('Pedido não encontrado.');
    return order;
  }

  async confirm(companyId: string, id: string) {
    const order = await this.one(companyId, id);
    if (order.status !== 'DRAFT') throw new BadRequestException('Pedido já processado.');
    return this.prisma.salesOrder.update({ where: { id }, data: { status: 'CONFIRMED' }, include: this.include() });
  }

  async reserve(companyId: string, id: string) {
    const order = await this.one(companyId, id);
    if (!['CONFIRMED', 'PARTIAL'].includes(order.status)) throw new BadRequestException('Somente pedido confirmado ou parcial pode reservar estoque.');
    return this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const needed = item.quantity.sub(item.fulfilledQuantity).sub(item.reservedQuantity);
        if (needed.lte(0)) continue;
        const balance = await tx.inventoryBalance.findUnique({ where: { branchId_productId: { branchId: order.branchId, productId: item.productId } } });
        if (!balance || balance.available.lt(needed)) throw new BadRequestException(`Estoque disponível insuficiente para ${item.product.name}.`);
        await tx.inventoryBalance.update({ where: { id: balance.id }, data: { reserved: balance.reserved.add(needed), available: balance.available.sub(needed) } });
        await tx.salesOrderItem.update({ where: { id: item.id }, data: { reservedQuantity: item.reservedQuantity.add(needed) } });
      }
      return tx.salesOrder.findUnique({ where: { id }, include: this.include() });
    });
  }

  async releaseReservation(companyId: string, id: string) {
    const order = await this.one(companyId, id);
    return this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (item.reservedQuantity.lte(0)) continue;
        const balance = await tx.inventoryBalance.findUnique({ where: { branchId_productId: { branchId: order.branchId, productId: item.productId } } });
        if (!balance || balance.reserved.lt(item.reservedQuantity)) throw new BadRequestException('Reserva de estoque inconsistente.');
        await tx.inventoryBalance.update({ where: { id: balance.id }, data: { reserved: balance.reserved.sub(item.reservedQuantity), available: balance.available.add(item.reservedQuantity) } });
        await tx.salesOrderItem.update({ where: { id: item.id }, data: { reservedQuantity: new Prisma.Decimal(0) } });
      }
      return tx.salesOrder.findUnique({ where: { id }, include: this.include() });
    });
  }

  async cancel(companyId: string, id: string) {
    const order = await this.one(companyId, id);
    if (['CONVERTED', 'FULFILLED'].includes(order.status)) throw new BadRequestException('Pedido concluído não pode ser cancelado.');
    return this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (item.reservedQuantity.lte(0)) continue;
        const balance = await tx.inventoryBalance.findUnique({ where: { branchId_productId: { branchId: order.branchId, productId: item.productId } } });
        if (balance) {
          await tx.inventoryBalance.update({ where: { id: balance.id }, data: { reserved: balance.reserved.sub(item.reservedQuantity), available: balance.available.add(item.reservedQuantity) } });
        }
        await tx.salesOrderItem.update({ where: { id: item.id }, data: { reservedQuantity: new Prisma.Decimal(0) } });
      }
      return tx.salesOrder.update({ where: { id }, data: { status: 'CANCELLED' }, include: this.include() });
    });
  }

  async convertToSale(companyId: string, id: string, saleNumber: string) {
    const order = await this.one(companyId, id);
    if (!['CONFIRMED', 'PARTIAL', 'FULFILLED'].includes(order.status)) throw new BadRequestException('Pedido precisa estar confirmado para virar venda.');
    if (order.sale) return order.sale;
    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          companyId,
          branchId: order.branchId,
          customerId: order.customerId,
          paymentTermId: order.paymentTermId,
          number: saleNumber,
          totalAmount: order.totalAmount,
          notes: order.notes,
          items: { create: order.items.map((item) => ({ productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice, discountAmount: item.discountAmount, totalAmount: item.totalAmount })) },
        },
        include: { items: true },
      });
      await tx.salesOrder.update({ where: { id }, data: { status: 'CONVERTED', saleId: sale.id } });
      return sale;
    });
  }
}
