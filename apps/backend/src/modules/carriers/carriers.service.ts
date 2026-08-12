import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateCarrierDto } from './dto/create-carrier.dto';
import { UpdateCarrierDto } from './dto/update-carrier.dto';

@Injectable()
export class CarriersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateCarrierDto) {
    const duplicate = await this.prisma.carrier.findFirst({ where: { companyId, name: dto.name, deletedAt: null } });
    if (duplicate) throw new ConflictException('Já existe uma transportadora com este nome.');
    return this.prisma.carrier.create({ data: { companyId, ...dto, email: dto.email?.toLowerCase() } });
  }

  findAll(companyId: string) {
    return this.prisma.carrier.findMany({ where: { companyId, deletedAt: null }, orderBy: { name: 'asc' } });
  }

  async findOne(companyId: string, id: string) {
    const carrier = await this.prisma.carrier.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!carrier) throw new NotFoundException('Transportadora não encontrada.');
    return carrier;
  }

  async update(companyId: string, id: string, dto: UpdateCarrierDto) {
    await this.findOne(companyId, id);
    if (dto.name) {
      const duplicate = await this.prisma.carrier.findFirst({ where: { companyId, name: dto.name, id: { not: id }, deletedAt: null } });
      if (duplicate) throw new ConflictException('Já existe outra transportadora com este nome.');
    }
    return this.prisma.carrier.update({ where: { id }, data: { ...dto, email: dto.email?.toLowerCase() } });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.carrier.update({ where: { id }, data: { status: 'INACTIVE', deletedAt: new Date() } });
  }
}
