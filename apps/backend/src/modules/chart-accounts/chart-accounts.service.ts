import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateChartAccountDto } from './dto/create-chart-account.dto';
import { UpdateChartAccountDto } from './dto/update-chart-account.dto';

@Injectable()
export class ChartAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateChartAccountDto) {
    const existing = await this.prisma.chartAccount.findFirst({ where: { companyId, code: dto.code, deletedAt: null } });
    if (existing) throw new ConflictException('Já existe uma conta contábil com este código.');
    return this.prisma.chartAccount.create({ data: { companyId, ...dto } });
  }

  findAll(companyId: string) {
    return this.prisma.chartAccount.findMany({ where: { companyId, deletedAt: null }, orderBy: { code: 'asc' } });
  }

  async findOne(companyId: string, id: string) {
    const row = await this.prisma.chartAccount.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!row) throw new NotFoundException('Conta contábil não encontrada.');
    return row;
  }

  async update(companyId: string, id: string, dto: UpdateChartAccountDto) {
    await this.findOne(companyId, id);
    if (dto.code) {
      const duplicate = await this.prisma.chartAccount.findFirst({ where: { companyId, code: dto.code, id: { not: id }, deletedAt: null } });
      if (duplicate) throw new ConflictException('Já existe outra conta contábil com este código.');
    }
    return this.prisma.chartAccount.update({ where: { id }, data: dto });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.chartAccount.update({ where: { id }, data: { status: 'INACTIVE', deletedAt: new Date() } });
  }
}
