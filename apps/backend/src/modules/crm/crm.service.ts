import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateActivityDto, CreateLeadDto, CreateOpportunityDto, ConvertLeadDto } from './dto/crm.dto';
@Injectable() export class CrmService {
 constructor(private readonly prisma: PrismaService) {}
 createLead(companyId:string,dto:CreateLeadDto){ return this.prisma.crmLead.create({data:{companyId,...dto}}); }
 listLeads(companyId:string){ return this.prisma.crmLead.findMany({where:{companyId},orderBy:{createdAt:'desc'},include:{opportunities:true,activities:true}}); }
 async createOpportunity(companyId:string,dto:CreateOpportunityDto){ if(dto.leadId && !await this.prisma.crmLead.findFirst({where:{id:dto.leadId,companyId}})) throw new NotFoundException('Lead não encontrado.'); if(dto.customerId && !await this.prisma.customer.findFirst({where:{id:dto.customerId,companyId,deletedAt:null}})) throw new NotFoundException('Cliente não encontrado.'); return this.prisma.crmOpportunity.create({data:{companyId,...dto,amount:new Prisma.Decimal(dto.amount??0),probability:dto.probability??0}}); }
 listOpportunities(companyId:string){ return this.prisma.crmOpportunity.findMany({where:{companyId},orderBy:{createdAt:'desc'},include:{lead:true,customer:true,activities:true}}); }
 async createActivity(companyId:string,userId:string,dto:CreateActivityDto){ if(!dto.leadId&&!dto.opportunityId) throw new BadRequestException('Informe leadId ou opportunityId.'); return this.prisma.crmActivity.create({data:{companyId,userId,...dto,dueAt:dto.dueAt?new Date(dto.dueAt):undefined}}); }
 async completeActivity(companyId:string,id:string){ const a=await this.prisma.crmActivity.findFirst({where:{id,companyId}}); if(!a) throw new NotFoundException('Atividade não encontrada.'); return this.prisma.crmActivity.update({where:{id},data:{status:'DONE',completedAt:new Date()}}); }
 async convertLead(companyId:string,id:string,dto:ConvertLeadDto){ const lead=await this.prisma.crmLead.findFirst({where:{id,companyId}}); if(!lead) throw new NotFoundException('Lead não encontrado.'); if(lead.status==='CONVERTED') throw new BadRequestException('Lead já convertido.'); return this.prisma.$transaction(async tx=>{ const customer=await tx.customer.create({data:{companyId,type:'INDIVIDUAL',name:lead.name,document:dto.document,email:dto.email??lead.email,phone:dto.phone??lead.phone}}); await tx.crmLead.update({where:{id},data:{status:'CONVERTED',convertedCustomerId:customer.id}}); await tx.crmOpportunity.updateMany({where:{leadId:id,companyId},data:{customerId:customer.id}}); return customer; }); }
}
