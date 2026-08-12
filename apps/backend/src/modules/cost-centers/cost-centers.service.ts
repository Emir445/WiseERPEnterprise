import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateCostCenterDto } from './dto/create-cost-center.dto';
import { UpdateCostCenterDto } from './dto/update-cost-center.dto';

@Injectable()
export class CostCentersService {
  constructor(private readonly prisma: PrismaService) {}
  async create(companyId: string, dto: CreateCostCenterDto) {
    const existing = await this.prisma.costCenter.findFirst({ where: { companyId, code: dto.code, deletedAt: null } });
    if (existing) throw new ConflictException('Já existe um centro de custo com este código.');
    return this.prisma.costCenter.create({ data: { companyId, ...dto } });
  }
  findAll(companyId: string) { return this.prisma.costCenter.findMany({ where: { companyId, deletedAt: null }, orderBy: { code: 'asc' } }); }
  async findOne(companyId: string, id: string) {
    const row = await this.prisma.costCenter.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!row) throw new NotFoundException('Centro de custo não encontrado.');
    return row;
  }
  async update(companyId: string, id: string, dto: UpdateCostCenterDto) {
    await this.findOne(companyId, id);
    if (dto.code) {
      const duplicate = await this.prisma.costCenter.findFirst({ where: { companyId, code: dto.code, id: { not: id }, deletedAt: null } });
      if (duplicate) throw new ConflictException('Já existe outro centro de custo com este código.');
    }
    return this.prisma.costCenter.update({ where: { id }, data: dto });
  }
  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.costCenter.update({ where: { id }, data: { status: 'INACTIVE', deletedAt: new Date() } });
  }
}
