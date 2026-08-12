import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreatePaymentTermDto } from './dto/create-payment-term.dto';
import { UpdatePaymentTermDto } from './dto/update-payment-term.dto';

@Injectable()
export class PaymentTermsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreatePaymentTermDto) {
    const exists = await this.prisma.paymentTerm.findFirst({ where: { companyId, name: dto.name, deletedAt: null } });
    if (exists) throw new ConflictException('Já existe uma condição de pagamento com este nome.');
    return this.prisma.paymentTerm.create({ data: { companyId, name: dto.name, installments: dto.installments, firstDueDays: dto.firstDueDays ?? 0, intervalDays: dto.intervalDays ?? 30 } });
  }
  findAll(companyId: string) { return this.prisma.paymentTerm.findMany({ where: { companyId, deletedAt: null }, orderBy: { name: 'asc' } }); }
  async findOne(companyId: string, id: string) {
    const row = await this.prisma.paymentTerm.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!row) throw new NotFoundException('Condição de pagamento não encontrada.');
    return row;
  }
  async update(companyId: string, id: string, dto: UpdatePaymentTermDto) {
    await this.findOne(companyId, id);
    return this.prisma.paymentTerm.update({ where: { id }, data: dto });
  }
  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.paymentTerm.update({ where: { id }, data: { status: 'INACTIVE', deletedAt: new Date() } });
  }
}
