import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../core/database/prisma.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { ListProductCategoriesQueryDto } from './dto/list-product-categories-query.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';

@Injectable()
export class ProductCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateProductCategoryDto) {
    const existing = await this.prisma.productCategory.findFirst({
      where: { companyId, name: dto.name, deletedAt: null },
    });
    if (existing) throw new ConflictException('Já existe uma categoria com este nome.');

    return this.prisma.productCategory.create({
      data: { companyId, name: dto.name, description: dto.description, status: 'ACTIVE' },
    });
  }

  async findAll(companyId: string, query: ListProductCategoriesQueryDto) {
    const skip = (query.page - 1) * query.limit;
    const where: Prisma.ProductCategoryWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.productCategory.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { name: 'asc' },
        include: { _count: { select: { products: true } } },
      }),
      this.prisma.productCategory.count({ where }),
    ]);

    return { data, meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
  }

  async findOne(companyId: string, id: string) {
    const category = await this.prisma.productCategory.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { _count: { select: { products: true } } },
    });
    if (!category) throw new NotFoundException('Categoria não encontrada.');
    return category;
  }

  async update(companyId: string, id: string, dto: UpdateProductCategoryDto) {
    const category = await this.findOne(companyId, id);
    if (dto.name && dto.name !== category.name) {
      const duplicate = await this.prisma.productCategory.findFirst({
        where: { companyId, name: dto.name, id: { not: id }, deletedAt: null },
      });
      if (duplicate) throw new ConflictException('Já existe outra categoria com este nome.');
    }

    return this.prisma.productCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
    });
  }

  async remove(companyId: string, id: string) {
    const category = await this.findOne(companyId, id);
    if (category._count.products > 0) {
      throw new BadRequestException('Categoria com produtos vinculados não pode ser inativada.');
    }
    return this.prisma.productCategory.update({
      where: { id },
      data: { status: 'INACTIVE', deletedAt: new Date() },
    });
  }
}
