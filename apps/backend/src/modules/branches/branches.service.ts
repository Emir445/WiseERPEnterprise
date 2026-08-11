import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../core/database/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { ListBranchesQueryDto } from './dto/list-branches-query.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateBranchDto) {
    const existing = await this.prisma.branch.findFirst({
      where: { companyId, code: dto.code, deletedAt: null },
    });
    if (existing) throw new ConflictException('Já existe uma filial com este código.');

    return this.prisma.branch.create({
      data: {
        companyId,
        name: dto.name,
        code: dto.code,
        document: dto.document,
        email: dto.email?.toLowerCase(),
        phone: dto.phone,
        status: 'ACTIVE',
      },
    });
  }

  async findAll(companyId: string, query: ListBranchesQueryDto) {
    const skip = (query.page - 1) * query.limit;
    const where: Prisma.BranchWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { code: { contains: query.search, mode: 'insensitive' } },
              { document: { contains: query.search } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.branch.findMany({ where, skip, take: query.limit, orderBy: { name: 'asc' } }),
      this.prisma.branch.count({ where }),
    ]);

    return { data, meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
  }

  async findOne(companyId: string, id: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!branch) throw new NotFoundException('Filial não encontrada.');
    return branch;
  }

  async update(companyId: string, id: string, dto: UpdateBranchDto) {
    const branch = await this.findOne(companyId, id);
    if (dto.code && dto.code !== branch.code) {
      const duplicate = await this.prisma.branch.findFirst({
        where: { companyId, code: dto.code, id: { not: id }, deletedAt: null },
      });
      if (duplicate) throw new ConflictException('Já existe outra filial com este código.');
    }

    return this.prisma.branch.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.document !== undefined ? { document: dto.document } : {}),
        ...(dto.email !== undefined ? { email: dto.email?.toLowerCase() } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      },
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.branch.update({
      where: { id },
      data: { status: 'INACTIVE', deletedAt: new Date() },
    });
  }
}
