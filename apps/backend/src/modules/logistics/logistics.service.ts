import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { CreateCustomerReturnDto } from './dto/create-return.dto';

@Injectable()
export class LogisticsService {
  constructor(private readonly prisma: PrismaService) {}

  private shipmentInclude() {
    return {
      carrier: true,
      branch: true,
      customer: true,
      salesOrder: { include: { items: { include: { product: true } } } },
      items: { include: { product: true, salesOrderItem: true } },
    } as const;
  }

  private returnInclude() {
    return { branch: true, customer: true, sale: true, items: { include: { product: true } } } as const;
  }

  findShipments(companyId: string) {
    return this.prisma.shipment.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' }, include: this.shipmentInclude() });
  }

  async createShipment(companyId: string, dto: CreateShipmentDto) {
    if (await this.prisma.shipment.findFirst({ where: { companyId, number: dto.number } })) {
      throw new ConflictException('Já existe uma expedição com este número.');
    }
    const order = await this.prisma.salesOrder.findFirst({
      where: { id: dto.salesOrderId, companyId, deletedAt: null },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Pedido de venda não encontrado.');
    if (!['CONFIRMED', 'PARTIAL'].includes(order.status)) throw new BadRequestException('Somente pedido confirmado ou parcial pode ser expedido.');
    if (dto.carrierId) {
      const carrier = await this.prisma.carrier.findFirst({ where: { id: dto.carrierId, companyId, status: 'ACTIVE', deletedAt: null } });
      if (!carrier) throw new NotFoundException('Transportadora não encontrada.');
    }
    const byId = new Map(order.items.map((i) => [i.id, i]));
    const seen = new Set<string>();
    const items = dto.items.map((item) => {
      if (seen.has(item.salesOrderItemId)) throw new BadRequestException('Item de pedido duplicado na expedição.');
      seen.add(item.salesOrderItemId);
      const orderItem = byId.get(item.salesOrderItemId);
      if (!orderItem) throw new BadRequestException('Item não pertence ao pedido informado.');
      const quantity = new Prisma.Decimal(item.quantity);
      if (quantity.gt(orderItem.reservedQuantity)) throw new BadRequestException(`Quantidade maior que a reserva do produto ${orderItem.productId}.`);
      return { salesOrderItemId: orderItem.id, productId: orderItem.productId, quantity };
    });
    return this.prisma.shipment.create({
      data: {
        companyId,
        branchId: order.branchId,
        customerId: order.customerId,
        salesOrderId: order.id,
        carrierId: dto.carrierId,
        number: dto.number,
        trackingCode: dto.trackingCode,
        notes: dto.notes,
        items: { create: items },
      },
      include: this.shipmentInclude(),
    });
  }

  async pickShipment(companyId: string, id: string) {
    const shipment = await this.getShipment(companyId, id);
    if (shipment.status !== 'DRAFT') throw new BadRequestException('Somente expedição em rascunho pode iniciar separação.');
    return this.prisma.shipment.update({ where: { id }, data: { status: 'PICKING' }, include: this.shipmentInclude() });
  }

  async shipShipment(companyId: string, id: string) {
    const shipment = await this.getShipment(companyId, id);
    if (shipment.status !== 'PICKING') throw new BadRequestException('A expedição deve estar em separação antes do envio.');
    return this.prisma.$transaction(async (tx) => {
      for (const item of shipment.items) {
        const orderItem = await tx.salesOrderItem.findUnique({ where: { id: item.salesOrderItemId } });
        if (!orderItem || orderItem.reservedQuantity.lt(item.quantity)) throw new BadRequestException('Reserva insuficiente para concluir a expedição.');
        const balance = await tx.inventoryBalance.findUnique({ where: { branchId_productId: { branchId: shipment.branchId, productId: item.productId } } });
        if (!balance || balance.quantity.lt(item.quantity) || balance.reserved.lt(item.quantity)) throw new BadRequestException('Saldo reservado inconsistente para expedição.');
        const previousQty = balance.quantity;
        const currentQty = previousQty.sub(item.quantity);
        await tx.inventoryBalance.update({
          where: { id: balance.id },
          data: { quantity: currentQty, reserved: balance.reserved.sub(item.quantity) },
        });
        await tx.salesOrderItem.update({
          where: { id: orderItem.id },
          data: { reservedQuantity: orderItem.reservedQuantity.sub(item.quantity), fulfilledQuantity: orderItem.fulfilledQuantity.add(item.quantity) },
        });
        await tx.inventoryMovement.create({
          data: { companyId, branchId: shipment.branchId, productId: item.productId, type: 'EXIT', quantity: item.quantity, previousQty, currentQty, referenceType: 'SHIPMENT', referenceId: shipment.id, notes: `Expedição ${shipment.number}` },
        });
      }
      const orderItems = await tx.salesOrderItem.findMany({ where: { salesOrderId: shipment.salesOrderId } });
      const fulfilled = orderItems.every((i) => i.fulfilledQuantity.gte(i.quantity));
      await tx.salesOrder.update({ where: { id: shipment.salesOrderId }, data: { status: fulfilled ? 'FULFILLED' : 'PARTIAL' } });
      return tx.shipment.update({ where: { id }, data: { status: 'SHIPPED', shippedAt: new Date() }, include: this.shipmentInclude() });
    });
  }

  async deliverShipment(companyId: string, id: string) {
    const shipment = await this.getShipment(companyId, id);
    if (shipment.status !== 'SHIPPED') throw new BadRequestException('Somente expedição enviada pode ser entregue.');
    return this.prisma.shipment.update({ where: { id }, data: { status: 'DELIVERED', deliveredAt: new Date() }, include: this.shipmentInclude() });
  }

  async cancelShipment(companyId: string, id: string) {
    const shipment = await this.getShipment(companyId, id);
    if (['SHIPPED', 'DELIVERED'].includes(shipment.status)) throw new BadRequestException('Expedição já movimentada não pode ser cancelada diretamente.');
    return this.prisma.shipment.update({ where: { id }, data: { status: 'CANCELLED' }, include: this.shipmentInclude() });
  }

  findReturns(companyId: string) {
    return this.prisma.customerReturn.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' }, include: this.returnInclude() });
  }

  async createReturn(companyId: string, dto: CreateCustomerReturnDto) {
    if (await this.prisma.customerReturn.findFirst({ where: { companyId, number: dto.number } })) throw new ConflictException('Já existe uma devolução com este número.');
    const sale = await this.prisma.sale.findFirst({ where: { id: dto.saleId, companyId, status: 'CONFIRMED', deletedAt: null }, include: { items: true } });
    if (!sale) throw new NotFoundException('Venda confirmada não encontrada.');
    const previousReturns = await this.prisma.customerReturn.findMany({ where: { saleId: sale.id, status: 'RECEIVED' }, include: { items: true } });
    const returnedByProduct = new Map<string, Prisma.Decimal>();
    for (const ret of previousReturns) for (const item of ret.items) returnedByProduct.set(item.productId, (returnedByProduct.get(item.productId) ?? new Prisma.Decimal(0)).add(item.quantity));
    const soldByProduct = new Map<string, Prisma.Decimal>();
    for (const item of sale.items) soldByProduct.set(item.productId, (soldByProduct.get(item.productId) ?? new Prisma.Decimal(0)).add(item.quantity));
    const items = dto.items.map((item) => {
      const quantity = new Prisma.Decimal(item.quantity);
      const sold = soldByProduct.get(item.productId);
      const alreadyReturned = returnedByProduct.get(item.productId) ?? new Prisma.Decimal(0);
      if (!sold || alreadyReturned.add(quantity).gt(sold)) throw new BadRequestException('Quantidade devolvida excede a quantidade vendida.');
      return { productId: item.productId, quantity, reason: item.reason, restock: item.restock ?? true };
    });
    return this.prisma.customerReturn.create({
      data: { companyId, branchId: sale.branchId, customerId: sale.customerId, saleId: sale.id, number: dto.number, notes: dto.notes, items: { create: items } },
      include: this.returnInclude(),
    });
  }

  async receiveReturn(companyId: string, id: string) {
    const ret = await this.getReturn(companyId, id);
    if (ret.status !== 'DRAFT') throw new BadRequestException('Devolução já processada.');
    return this.prisma.$transaction(async (tx) => {
      for (const item of ret.items) {
        if (!item.restock) continue;
        const balance = await tx.inventoryBalance.findUnique({ where: { branchId_productId: { branchId: ret.branchId, productId: item.productId } } });
        const previousQty = balance?.quantity ?? new Prisma.Decimal(0);
        const reserved = balance?.reserved ?? new Prisma.Decimal(0);
        const currentQty = previousQty.add(item.quantity);
        const available = currentQty.sub(reserved);
        await tx.inventoryBalance.upsert({
          where: { branchId_productId: { branchId: ret.branchId, productId: item.productId } },
          update: { quantity: currentQty, available },
          create: { companyId, branchId: ret.branchId, productId: item.productId, quantity: currentQty, reserved, available },
        });
        await tx.inventoryMovement.create({
          data: { companyId, branchId: ret.branchId, productId: item.productId, type: 'ENTRY', quantity: item.quantity, previousQty, currentQty, referenceType: 'CUSTOMER_RETURN', referenceId: ret.id, notes: `Devolução ${ret.number}` },
        });
      }
      return tx.customerReturn.update({ where: { id }, data: { status: 'RECEIVED', receivedAt: new Date() }, include: this.returnInclude() });
    });
  }

  async cancelReturn(companyId: string, id: string) {
    const ret = await this.getReturn(companyId, id);
    if (ret.status === 'RECEIVED') throw new BadRequestException('Devolução recebida não pode ser cancelada diretamente.');
    return this.prisma.customerReturn.update({ where: { id }, data: { status: 'CANCELLED' }, include: this.returnInclude() });
  }

  private async getShipment(companyId: string, id: string) {
    const shipment = await this.prisma.shipment.findFirst({ where: { id, companyId }, include: this.shipmentInclude() });
    if (!shipment) throw new NotFoundException('Expedição não encontrada.');
    return shipment;
  }

  private async getReturn(companyId: string, id: string) {
    const ret = await this.prisma.customerReturn.findFirst({ where: { id, companyId }, include: this.returnInclude() });
    if (!ret) throw new NotFoundException('Devolução não encontrada.');
    return ret;
  }
}
