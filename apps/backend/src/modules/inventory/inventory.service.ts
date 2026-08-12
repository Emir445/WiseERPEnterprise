import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../core/database/prisma.service';
import { CreateInventoryTransferDto } from './dto/create-inventory-transfer.dto';
import { InventoryAdjustmentDto } from './dto/inventory-adjustment.dto';
import { InventoryEntryDto } from './dto/inventory-entry.dto';
import { InventoryExitDto } from './dto/inventory-exit.dto';
import { ListInventoryQueryDto } from './dto/list-inventory-query.dto';
import { ListInventoryTransfersQueryDto } from './dto/list-inventory-transfers-query.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    companyId: string,
    query: ListInventoryQueryDto,
  ) {
    const skip = (query.page - 1) * query.limit;

    const where: Prisma.InventoryBalanceWhereInput = {
      companyId,
      ...(query.branchId
        ? { branchId: query.branchId }
        : {}),
      ...(query.productId
        ? { productId: query.productId }
        : {}),
      ...(query.search
        ? {
            product: {
              OR: [
                {
                  name: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
                {
                  sku: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              ],
            },
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.inventoryBalance.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: [
          {
            product: {
              name: 'asc',
            },
          },
        ],
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
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
      }),
      this.prisma.inventoryBalance.count({
        where,
      }),
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

  async findMovements(
    companyId: string,
    productId?: string,
    branchId?: string,
  ) {
    return this.prisma.inventoryMovement.findMany({
      where: {
        companyId,
        ...(productId ? { productId } : {}),
        ...(branchId ? { branchId } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      take: 100,
    });
  }

  async entry(
    companyId: string,
    dto: InventoryEntryDto,
  ) {
    await this.validateEntities(
      companyId,
      dto.branchId,
      dto.productId,
    );

    return this.prisma.$transaction(async (tx) => {
      const balance = await tx.inventoryBalance.findUnique({
        where: {
          branchId_productId: {
            branchId: dto.branchId,
            productId: dto.productId,
          },
        },
      });

      const previousQty = balance?.quantity ?? new Prisma.Decimal(0);
      const quantity = new Prisma.Decimal(dto.quantity);
      const currentQty = previousQty.plus(quantity);
      const reserved = balance?.reserved ?? new Prisma.Decimal(0);
      const available = currentQty.minus(reserved);

      const updatedBalance = await tx.inventoryBalance.upsert({
        where: {
          branchId_productId: {
            branchId: dto.branchId,
            productId: dto.productId,
          },
        },
        update: {
          quantity: currentQty,
          available,
        },
        create: {
          companyId,
          branchId: dto.branchId,
          productId: dto.productId,
          quantity: currentQty,
          reserved,
          available,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          companyId,
          branchId: dto.branchId,
          productId: dto.productId,
          type: 'ENTRY',
          quantity,
          previousQty,
          currentQty,
          referenceType: dto.referenceType,
          referenceId: dto.referenceId,
          notes: dto.notes,
        },
      });

      return updatedBalance;
    });
  }

  async exit(
    companyId: string,
    dto: InventoryExitDto,
  ) {
    await this.validateEntities(
      companyId,
      dto.branchId,
      dto.productId,
    );

    return this.prisma.$transaction(async (tx) => {
      const balance = await tx.inventoryBalance.findUnique({
        where: {
          branchId_productId: {
            branchId: dto.branchId,
            productId: dto.productId,
          },
        },
      });

      if (!balance) {
        throw new BadRequestException(
          'Produto sem saldo de estoque nesta filial.',
        );
      }

      const quantity = new Prisma.Decimal(dto.quantity);
      const previousQty = balance.quantity;

      if (previousQty.lessThan(quantity)) {
        throw new BadRequestException(
          'Saldo de estoque insuficiente.',
        );
      }

      const currentQty = previousQty.minus(quantity);
      const available = currentQty.minus(balance.reserved);

      const updatedBalance = await tx.inventoryBalance.update({
        where: {
          id: balance.id,
        },
        data: {
          quantity: currentQty,
          available,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          companyId,
          branchId: dto.branchId,
          productId: dto.productId,
          type: 'EXIT',
          quantity,
          previousQty,
          currentQty,
          referenceType: dto.referenceType,
          referenceId: dto.referenceId,
          notes: dto.notes,
        },
      });

      return updatedBalance;
    });
  }

  async adjustment(
    companyId: string,
    dto: InventoryAdjustmentDto,
  ) {
    await this.validateEntities(
      companyId,
      dto.branchId,
      dto.productId,
    );

    return this.prisma.$transaction(async (tx) => {
      const balance = await tx.inventoryBalance.findUnique({
        where: {
          branchId_productId: {
            branchId: dto.branchId,
            productId: dto.productId,
          },
        },
      });

      const previousQty = balance?.quantity ?? new Prisma.Decimal(0);
      const currentQty = new Prisma.Decimal(dto.quantity);
      const reserved = balance?.reserved ?? new Prisma.Decimal(0);

      if (currentQty.lessThan(reserved)) {
        throw new BadRequestException(
          'O novo saldo não pode ser menor que a quantidade reservada.',
        );
      }

      const available = currentQty.minus(reserved);
      const difference = currentQty.minus(previousQty);

      const updatedBalance = await tx.inventoryBalance.upsert({
        where: {
          branchId_productId: {
            branchId: dto.branchId,
            productId: dto.productId,
          },
        },
        update: {
          quantity: currentQty,
          available,
        },
        create: {
          companyId,
          branchId: dto.branchId,
          productId: dto.productId,
          quantity: currentQty,
          reserved,
          available,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          companyId,
          branchId: dto.branchId,
          productId: dto.productId,
          type: 'ADJUSTMENT',
          quantity: difference,
          previousQty,
          currentQty,
          referenceType: 'INVENTORY',
          notes: dto.notes,
        },
      });

      return updatedBalance;
    });
  }


  async findTransfers(
    companyId: string,
    query: ListInventoryTransfersQueryDto,
  ) {
    const skip = (query.page - 1) * query.limit;
    const where: Prisma.InventoryTransferWhereInput = {
      companyId,
      ...(query.branchId
        ? {
            OR: [
              { fromBranchId: query.branchId },
              { toBranchId: query.branchId },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.inventoryTransfer.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          fromBranch: { select: { id: true, name: true, code: true } },
          toBranch: { select: { id: true, name: true, code: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true, unit: true } },
            },
          },
        },
      }),
      this.prisma.inventoryTransfer.count({ where }),
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

  async transfer(companyId: string, dto: CreateInventoryTransferDto) {
    if (dto.fromBranchId === dto.toBranchId) {
      throw new BadRequestException(
        'A filial de origem e a filial de destino devem ser diferentes.',
      );
    }

    const [fromBranch, toBranch, products, duplicate] = await Promise.all([
      this.prisma.branch.findFirst({
        where: { id: dto.fromBranchId, companyId, deletedAt: null, status: 'ACTIVE' },
      }),
      this.prisma.branch.findFirst({
        where: { id: dto.toBranchId, companyId, deletedAt: null, status: 'ACTIVE' },
      }),
      this.prisma.product.findMany({
        where: {
          id: { in: dto.items.map((item) => item.productId) },
          companyId,
          deletedAt: null,
          status: 'ACTIVE',
        },
      }),
      this.prisma.inventoryTransfer.findFirst({
        where: { companyId, number: dto.number },
      }),
    ]);

    if (!fromBranch) throw new NotFoundException('Filial de origem não encontrada.');
    if (!toBranch) throw new NotFoundException('Filial de destino não encontrada.');
    if (duplicate) throw new BadRequestException('Já existe uma transferência com este número.');
    if (products.length !== new Set(dto.items.map((item) => item.productId)).size) {
      throw new NotFoundException('Um ou mais produtos não foram encontrados.');
    }

    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.inventoryTransfer.create({
        data: {
          companyId,
          fromBranchId: dto.fromBranchId,
          toBranchId: dto.toBranchId,
          number: dto.number,
          notes: dto.notes,
          items: {
            create: dto.items.map((item) => ({
              productId: item.productId,
              quantity: new Prisma.Decimal(item.quantity),
            })),
          },
        },
        include: { items: true },
      });

      for (const item of transfer.items) {
        const source = await tx.inventoryBalance.findUnique({
          where: {
            branchId_productId: {
              branchId: dto.fromBranchId,
              productId: item.productId,
            },
          },
        });

        if (!source || source.available.lessThan(item.quantity)) {
          throw new BadRequestException(
            `Saldo insuficiente na filial de origem para o produto ${item.productId}.`,
          );
        }

        const sourcePrevious = source.quantity;
        const sourceCurrent = sourcePrevious.sub(item.quantity);
        const sourceAvailable = source.available.sub(item.quantity);

        await tx.inventoryBalance.update({
          where: { id: source.id },
          data: { quantity: sourceCurrent, available: sourceAvailable },
        });

        const target = await tx.inventoryBalance.findUnique({
          where: {
            branchId_productId: {
              branchId: dto.toBranchId,
              productId: item.productId,
            },
          },
        });

        const targetPrevious = target?.quantity ?? new Prisma.Decimal(0);
        const targetReserved = target?.reserved ?? new Prisma.Decimal(0);
        const targetCurrent = targetPrevious.add(item.quantity);
        const targetAvailable = targetCurrent.sub(targetReserved);

        await tx.inventoryBalance.upsert({
          where: {
            branchId_productId: {
              branchId: dto.toBranchId,
              productId: item.productId,
            },
          },
          update: { quantity: targetCurrent, available: targetAvailable },
          create: {
            companyId,
            branchId: dto.toBranchId,
            productId: item.productId,
            quantity: targetCurrent,
            reserved: targetReserved,
            available: targetAvailable,
          },
        });

        await tx.inventoryMovement.createMany({
          data: [
            {
              companyId,
              branchId: dto.fromBranchId,
              productId: item.productId,
              type: 'TRANSFER_OUT',
              quantity: item.quantity,
              previousQty: sourcePrevious,
              currentQty: sourceCurrent,
              referenceType: 'INVENTORY_TRANSFER',
              referenceId: transfer.id,
              notes: `Transferência ${transfer.number} para ${toBranch.name}`,
            },
            {
              companyId,
              branchId: dto.toBranchId,
              productId: item.productId,
              type: 'TRANSFER_IN',
              quantity: item.quantity,
              previousQty: targetPrevious,
              currentQty: targetCurrent,
              referenceType: 'INVENTORY_TRANSFER',
              referenceId: transfer.id,
              notes: `Transferência ${transfer.number} de ${fromBranch.name}`,
            },
          ],
        });
      }

      return tx.inventoryTransfer.findUnique({
        where: { id: transfer.id },
        include: {
          fromBranch: true,
          toBranch: true,
          items: { include: { product: true } },
        },
      });
    });
  }

  async cancelTransfer(companyId: string, id: string) {
    const transfer = await this.prisma.inventoryTransfer.findFirst({
      where: { id, companyId },
      include: {
        fromBranch: true,
        toBranch: true,
        items: { include: { product: true } },
      },
    });

    if (!transfer) throw new NotFoundException('Transferência não encontrada.');
    if (transfer.status === 'CANCELLED') return transfer;

    return this.prisma.$transaction(async (tx) => {
      for (const item of transfer.items) {
        const target = await tx.inventoryBalance.findUnique({
          where: {
            branchId_productId: {
              branchId: transfer.toBranchId,
              productId: item.productId,
            },
          },
        });

        if (!target || target.available.lessThan(item.quantity)) {
          throw new BadRequestException(
            `Não é possível cancelar: estoque transferido do produto ${item.product.name} já foi consumido.`,
          );
        }

        const targetPrevious = target.quantity;
        const targetCurrent = targetPrevious.sub(item.quantity);
        const targetAvailable = target.available.sub(item.quantity);

        await tx.inventoryBalance.update({
          where: { id: target.id },
          data: { quantity: targetCurrent, available: targetAvailable },
        });

        const source = await tx.inventoryBalance.findUnique({
          where: {
            branchId_productId: {
              branchId: transfer.fromBranchId,
              productId: item.productId,
            },
          },
        });

        const sourcePrevious = source?.quantity ?? new Prisma.Decimal(0);
        const sourceReserved = source?.reserved ?? new Prisma.Decimal(0);
        const sourceCurrent = sourcePrevious.add(item.quantity);
        const sourceAvailable = sourceCurrent.sub(sourceReserved);

        await tx.inventoryBalance.upsert({
          where: {
            branchId_productId: {
              branchId: transfer.fromBranchId,
              productId: item.productId,
            },
          },
          update: { quantity: sourceCurrent, available: sourceAvailable },
          create: {
            companyId,
            branchId: transfer.fromBranchId,
            productId: item.productId,
            quantity: sourceCurrent,
            reserved: sourceReserved,
            available: sourceAvailable,
          },
        });

        await tx.inventoryMovement.createMany({
          data: [
            {
              companyId,
              branchId: transfer.toBranchId,
              productId: item.productId,
              type: 'TRANSFER_OUT',
              quantity: item.quantity,
              previousQty: targetPrevious,
              currentQty: targetCurrent,
              referenceType: 'INVENTORY_TRANSFER_CANCEL',
              referenceId: transfer.id,
              notes: `Cancelamento da transferência ${transfer.number}`,
            },
            {
              companyId,
              branchId: transfer.fromBranchId,
              productId: item.productId,
              type: 'TRANSFER_IN',
              quantity: item.quantity,
              previousQty: sourcePrevious,
              currentQty: sourceCurrent,
              referenceType: 'INVENTORY_TRANSFER_CANCEL',
              referenceId: transfer.id,
              notes: `Cancelamento da transferência ${transfer.number}`,
            },
          ],
        });
      }

      return tx.inventoryTransfer.update({
        where: { id: transfer.id },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
        include: {
          fromBranch: true,
          toBranch: true,
          items: { include: { product: true } },
        },
      });
    });
  }

  private async validateEntities(
    companyId: string,
    branchId: string,
    productId: string,
  ) {
    const [branch, product] = await Promise.all([
      this.prisma.branch.findFirst({
        where: {
          id: branchId,
          companyId,
          deletedAt: null,
        },
      }),
      this.prisma.product.findFirst({
        where: {
          id: productId,
          companyId,
          deletedAt: null,
          status: 'ACTIVE',
        },
      }),
    ]);

    if (!branch) {
      throw new NotFoundException(
        'Filial não encontrada.',
      );
    }

    if (!product) {
      throw new NotFoundException(
        'Produto não encontrado.',
      );
    }
  }
}
