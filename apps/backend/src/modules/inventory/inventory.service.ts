import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../core/database/prisma.service';
import { InventoryAdjustmentDto } from './dto/inventory-adjustment.dto';
import { InventoryEntryDto } from './dto/inventory-entry.dto';
import { InventoryExitDto } from './dto/inventory-exit.dto';
import { ListInventoryQueryDto } from './dto/list-inventory-query.dto';

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
