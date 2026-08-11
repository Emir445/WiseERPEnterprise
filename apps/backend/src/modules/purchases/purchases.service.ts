import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../core/database/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { ListPurchasesQueryDto } from './dto/list-purchases-query.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreatePurchaseDto) {
    const existing = await this.prisma.purchase.findFirst({
      where: {
        companyId,
        number: dto.number,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Já existe uma compra com este número.',
      );
    }

    await this.validateEntities(
      companyId,
      dto.branchId,
      dto.supplierId,
      dto.items.map((item) => item.productId),
    );

    const items = dto.items.map((item) => {
      const quantity = new Prisma.Decimal(item.quantity);
      const unitCost = new Prisma.Decimal(item.unitCost);

      return {
        productId: item.productId,
        quantity,
        unitCost,
        totalAmount: quantity.mul(unitCost),
      };
    });

    const totalAmount = items.reduce(
      (total, item) => total.add(item.totalAmount),
      new Prisma.Decimal(0),
    );

    return this.prisma.purchase.create({
      data: {
        companyId,
        branchId: dto.branchId,
        supplierId: dto.supplierId,
        number: dto.number,
        notes: dto.notes,
        totalAmount,
        items: {
          create: items,
        },
      },
      include: {
        supplier: true,
        branch: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async findAll(
    companyId: string,
    query: ListPurchasesQueryDto,
  ) {
    const skip = (query.page - 1) * query.limit;

    const where = {
      companyId,
      deletedAt: null,
      ...(query.branchId ? { branchId: query.branchId } : {}),
      ...(query.supplierId ? { supplierId: query.supplierId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              {
                number: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                supplier: {
                  name: {
                    contains: query.search,
                    mode: 'insensitive' as const,
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.purchase.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          supplier: true,
          branch: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      }),
      this.prisma.purchase.count({
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

  async findOne(companyId: string, id: string) {
    const purchase = await this.prisma.purchase.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      include: {
        supplier: true,
        branch: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!purchase) {
      throw new NotFoundException('Compra não encontrada.');
    }

    return purchase;
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdatePurchaseDto,
  ) {
    const purchase = await this.findOne(companyId, id);

    if (purchase.status !== 'DRAFT') {
      throw new BadRequestException(
        'Somente compras em rascunho podem ser alteradas.',
      );
    }

    const nextBranchId = dto.branchId ?? purchase.branchId;
    const nextSupplierId = dto.supplierId ?? purchase.supplierId;

    const nextItems =
      dto.items ??
      purchase.items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
      }));

    await this.validateEntities(
      companyId,
      nextBranchId,
      nextSupplierId,
      nextItems.map((item) => item.productId),
    );

    const items = nextItems.map((item) => {
      const quantity = new Prisma.Decimal(item.quantity);
      const unitCost = new Prisma.Decimal(item.unitCost);

      return {
        productId: item.productId,
        quantity,
        unitCost,
        totalAmount: quantity.mul(unitCost),
      };
    });

    const totalAmount = items.reduce(
      (total, item) => total.add(item.totalAmount),
      new Prisma.Decimal(0),
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.purchaseItem.deleteMany({
        where: {
          purchaseId: id,
        },
      });

      return tx.purchase.update({
        where: {
          id,
        },
        data: {
          branchId: nextBranchId,
          supplierId: nextSupplierId,
          number: dto.number ?? purchase.number,
          notes: dto.notes ?? purchase.notes,
          totalAmount,
          items: {
            create: items,
          },
        },
        include: {
          supplier: true,
          branch: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });
  }

  async confirm(companyId: string, id: string) {
    const purchase = await this.findOne(companyId, id);

    if (purchase.status !== 'DRAFT') {
      throw new BadRequestException(
        'A compra já foi processada.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      for (const item of purchase.items) {
        const balance = await tx.inventoryBalance.findUnique({
          where: {
            branchId_productId: {
              branchId: purchase.branchId,
              productId: item.productId,
            },
          },
        });

        const previousQty =
          balance?.quantity ?? new Prisma.Decimal(0);

        const currentQty = previousQty.add(item.quantity);

        const reserved =
          balance?.reserved ?? new Prisma.Decimal(0);

        const available = currentQty.sub(reserved);

        await tx.inventoryBalance.upsert({
          where: {
            branchId_productId: {
              branchId: purchase.branchId,
              productId: item.productId,
            },
          },
          update: {
            quantity: currentQty,
            available,
          },
          create: {
            companyId,
            branchId: purchase.branchId,
            productId: item.productId,
            quantity: currentQty,
            reserved,
            available,
          },
        });

        await tx.inventoryMovement.create({
          data: {
            companyId,
            branchId: purchase.branchId,
            productId: item.productId,
            type: 'ENTRY',
            quantity: item.quantity,
            previousQty,
            currentQty,
            referenceType: 'PURCHASE',
            referenceId: purchase.id,
            notes: `Entrada da compra ${purchase.number}`,
          },
        });
      }

      return tx.purchase.update({
        where: {
          id,
        },
        data: {
          status: 'CONFIRMED',
        },
        include: {
          supplier: true,
          branch: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });
  }

  async cancel(companyId: string, id: string) {
    const purchase = await this.findOne(companyId, id);

    if (purchase.status === 'CONFIRMED') {
      throw new BadRequestException(
        'Compra confirmada não pode ser cancelada diretamente.',
      );
    }

    if (purchase.status === 'CANCELLED') {
      return purchase;
    }

    return this.prisma.purchase.update({
      where: {
        id,
      },
      data: {
        status: 'CANCELLED',
      },
    });
  }

  private async validateEntities(
    companyId: string,
    branchId: string,
    supplierId: string,
    productIds: string[],
  ) {
    const [branch, supplier, products] = await Promise.all([
      this.prisma.branch.findFirst({
        where: {
          id: branchId,
          companyId,
          deletedAt: null,
        },
      }),
      this.prisma.supplier.findFirst({
        where: {
          id: supplierId,
          companyId,
          deletedAt: null,
          status: 'ACTIVE',
        },
      }),
      this.prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
          companyId,
          deletedAt: null,
          status: 'ACTIVE',
        },
      }),
    ]);

    if (!branch) {
      throw new NotFoundException('Filial não encontrada.');
    }

    if (!supplier) {
      throw new NotFoundException('Fornecedor não encontrado.');
    }

    if (products.length !== new Set(productIds).size) {
      throw new NotFoundException(
        'Um ou mais produtos não foram encontrados.',
      );
    }
  }
}
