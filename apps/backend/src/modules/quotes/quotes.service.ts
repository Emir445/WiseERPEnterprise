import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { ListQuotesQueryDto } from './dto/list-quotes-query.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';

@Injectable()
export class QuotesService {
  constructor(private readonly prisma: PrismaService) {}
  private buildItems(items: CreateQuoteDto['items']) {
    return items.map(i => {
      const quantity = new Prisma.Decimal(i.quantity), unitPrice = new Prisma.Decimal(i.unitPrice), discountAmount = new Prisma.Decimal(i.discountAmount ?? 0);
      const gross = quantity.mul(unitPrice); if (discountAmount.gt(gross)) throw new BadRequestException('Desconto maior que o valor do item.');
      return { productId: i.productId, quantity, unitPrice, discountAmount, totalAmount: gross.sub(discountAmount) };
    });
  }
  private include() { return { branch: true, customer: true, paymentTerm: true, items: { include: { product: true } }, salesOrder: true } as const; }
  async validate(companyId: string, dto: Pick<CreateQuoteDto, 'branchId'|'customerId'|'paymentTermId'|'items'>) {
    const [branch, customer, term, products] = await Promise.all([
      this.prisma.branch.findFirst({ where: { id: dto.branchId, companyId, deletedAt: null } }),
      this.prisma.customer.findFirst({ where: { id: dto.customerId, companyId, status: 'ACTIVE', deletedAt: null } }),
      dto.paymentTermId ? this.prisma.paymentTerm.findFirst({ where: { id: dto.paymentTermId, companyId, status: 'ACTIVE', deletedAt: null } }) : Promise.resolve(true),
      this.prisma.product.findMany({ where: { id: { in: dto.items.map(i=>i.productId) }, companyId, status: 'ACTIVE', deletedAt: null } }),
    ]);
    if (!branch) throw new NotFoundException('Filial não encontrada.'); if (!customer) throw new NotFoundException('Cliente não encontrado.'); if (!term) throw new NotFoundException('Condição de pagamento não encontrada.');
    if (products.length !== new Set(dto.items.map(i=>i.productId)).size) throw new NotFoundException('Um ou mais produtos não foram encontrados.');
  }
  async create(companyId: string, dto: CreateQuoteDto) {
    if (await this.prisma.quote.findFirst({ where: { companyId, number: dto.number, deletedAt: null } })) throw new ConflictException('Número de orçamento já existe.');
    await this.validate(companyId, dto); const items=this.buildItems(dto.items); const totalAmount=items.reduce((a,i)=>a.add(i.totalAmount), new Prisma.Decimal(0));
    return this.prisma.quote.create({ data: { companyId, branchId:dto.branchId, customerId:dto.customerId, paymentTermId:dto.paymentTermId, number:dto.number, validUntil:dto.validUntil?new Date(dto.validUntil):null, notes:dto.notes, totalAmount, items:{create:items}}, include:this.include() });
  }
  async findAll(companyId:string,q:ListQuotesQueryDto){const where:Prisma.QuoteWhereInput={companyId,deletedAt:null,...(q.customerId?{customerId:q.customerId}:{}),...(q.status?{status:q.status}:{}),...(q.search?{OR:[{number:{contains:q.search,mode:'insensitive'}},{customer:{name:{contains:q.search,mode:'insensitive'}}}]}:{})}; const [data,total]=await this.prisma.$transaction([this.prisma.quote.findMany({where,skip:(q.page-1)*q.limit,take:q.limit,orderBy:{createdAt:'desc'},include:this.include()}),this.prisma.quote.count({where})]); return {data,meta:{page:q.page,limit:q.limit,total,totalPages:Math.ceil(total/q.limit)}};}
  async findOne(companyId:string,id:string){const r=await this.prisma.quote.findFirst({where:{id,companyId,deletedAt:null},include:this.include()}); if(!r)throw new NotFoundException('Orçamento não encontrado.'); return r;}
  async update(companyId:string,id:string,dto:UpdateQuoteDto){const row=await this.findOne(companyId,id); if(row.status!=='DRAFT')throw new BadRequestException('Somente orçamento em rascunho pode ser alterado.'); const merged:any={branchId:dto.branchId??row.branchId,customerId:dto.customerId??row.customerId,paymentTermId:dto.paymentTermId??row.paymentTermId,items:dto.items??row.items.map(i=>({productId:i.productId,quantity:Number(i.quantity),unitPrice:Number(i.unitPrice),discountAmount:Number(i.discountAmount)}))}; await this.validate(companyId,merged); const items=this.buildItems(merged.items); const totalAmount=items.reduce((a,i)=>a.add(i.totalAmount),new Prisma.Decimal(0)); return this.prisma.$transaction(async tx=>{await tx.quoteItem.deleteMany({where:{quoteId:id}}); return tx.quote.update({where:{id},data:{branchId:merged.branchId,customerId:merged.customerId,paymentTermId:merged.paymentTermId,number:dto.number??row.number,validUntil:dto.validUntil?new Date(dto.validUntil):row.validUntil,notes:dto.notes!==undefined?dto.notes:row.notes,totalAmount,items:{create:items}},include:this.include()});});}
  async setStatus(companyId:string,id:string,status:'SENT'|'APPROVED'|'REJECTED'|'CANCELLED'){const row=await this.findOne(companyId,id); if(row.status==='CONVERTED')throw new BadRequestException('Orçamento convertido não pode mudar de status.'); return this.prisma.quote.update({where:{id},data:{status},include:this.include()});}
  async convert(companyId:string,id:string,number:string){const q=await this.findOne(companyId,id); if(q.status!=='APPROVED')throw new BadRequestException('Somente orçamento aprovado pode virar pedido.'); if(q.salesOrder) return q.salesOrder; return this.prisma.$transaction(async tx=>{const order=await tx.salesOrder.create({data:{companyId,branchId:q.branchId,customerId:q.customerId,paymentTermId:q.paymentTermId,quoteId:q.id,number,totalAmount:q.totalAmount,notes:q.notes,items:{create:q.items.map(i=>({productId:i.productId,quantity:i.quantity,unitPrice:i.unitPrice,discountAmount:i.discountAmount,totalAmount:i.totalAmount}))}},include:{items:true}}); await tx.quote.update({where:{id:q.id},data:{status:'CONVERTED'}}); return order;});}
}
