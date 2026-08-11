import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../core/database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateProductDto) {
    await this.validateCategory(companyId, dto.categoryId);
    const existingSku = await this.prisma.product.findFirst({
      where: {
        companyId,
        sku: dto.sku,
        deletedAt: null,
      },
    });

    if (existingSku) {
      throw new ConflictException(
        'Já existe um produto com este SKU.',
      );
    }

    if (dto.barcode) {
      const existingBarcode =
        await this.prisma.product.findFirst({
          where: {
            companyId,
            barcode: dto.barcode,
            deletedAt: null,
          },
        });

      if (existingBarcode) {
        throw new ConflictException(
          'Já existe um produto com este código de barras.',
        );
      }
    }

    return this.prisma.product.create({
      data: {
        companyId,
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description,
        sku: dto.sku,
        barcode: dto.barcode,
        unit: dto.unit,
        costPrice: dto.costPrice ?? 0,
        salePrice: dto.salePrice ?? 0,
        minimumStock: dto.minimumStock ?? 0,
        status: 'ACTIVE',
      },
    });
  }

  async findAll(
    companyId: string,
    query: ListProductsQueryDto,
  ) {
    const skip = (query.page - 1) * query.limit;

    const where = {
      companyId,
      deletedAt: null,
      ...(query.unit ? { unit: query.unit } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              {
                name: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                sku: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                barcode: {
                  contains: query.search,
                },
              },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: {
          name: 'asc',
        },
        include: { category: true },
      }),
      this.prisma.product.count({
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
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      include: { category: true },
    });

    if (!product) {
      throw new NotFoundException(
        'Produto não encontrado.',
      );
    }

    return product;
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdateProductDto,
  ) {
    await this.findOne(companyId, id);
    await this.validateCategory(companyId, dto.categoryId);

    if (dto.sku) {
      const existingSku = await this.prisma.product.findFirst({
        where: {
          companyId,
          sku: dto.sku,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (existingSku) {
        throw new ConflictException(
          'Já existe outro produto com este SKU.',
        );
      }
    }

    if (dto.barcode) {
      const existingBarcode =
        await this.prisma.product.findFirst({
          where: {
            companyId,
            barcode: dto.barcode,
            deletedAt: null,
            id: { not: id },
          },
        });

      if (existingBarcode) {
        throw new ConflictException(
          'Já existe outro produto com este código de barras.',
        );
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.sku !== undefined ? { sku: dto.sku } : {}),
        ...(dto.barcode !== undefined
          ? { barcode: dto.barcode }
          : {}),
        ...(dto.unit !== undefined ? { unit: dto.unit } : {}),
        ...(dto.costPrice !== undefined
          ? { costPrice: dto.costPrice }
          : {}),
        ...(dto.salePrice !== undefined
          ? { salePrice: dto.salePrice }
          : {}),
        ...(dto.minimumStock !== undefined
          ? { minimumStock: dto.minimumStock }
          : {}),
      },
    });
  }

  private async validateCategory(companyId: string, categoryId?: string) {
    if (!categoryId) return;
    const category = await this.prisma.productCategory.findFirst({
      where: { id: categoryId, companyId, deletedAt: null, status: 'ACTIVE' },
    });
    if (!category) {
      throw new NotFoundException('Categoria de produto não encontrada.');
    }
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);

    await this.prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'INACTIVE',
      },
    });

    return { success: true };
  }
}
