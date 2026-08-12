import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator'; import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard'; import { JwtPayload } from '../../core/auth/interfaces/jwt-payload.interface'; import { Permissions } from '../../core/permissions/decorators/permissions.decorator'; import { PermissionsGuard } from '../../core/permissions/guards/permissions.guard';
import { CreateQuoteDto } from './dto/create-quote.dto'; import { UpdateQuoteDto } from './dto/update-quote.dto'; import { ListQuotesQueryDto } from './dto/list-quotes-query.dto'; import { QuotesService } from './quotes.service';
@ApiTags('Orçamentos') @ApiBearerAuth('bearer') @UseGuards(JwtAuthGuard,PermissionsGuard) @Controller('quotes')
export class QuotesController { constructor(private readonly s:QuotesService){}
@Post() @Permissions('quotes.create') create(@CurrentUser()u:JwtPayload,@Body()d:CreateQuoteDto){return this.s.create(u.companyId,d)}
@Get() @Permissions('quotes.read') all(@CurrentUser()u:JwtPayload,@Query()q:ListQuotesQueryDto){return this.s.findAll(u.companyId,q)}
@Get(':id') @Permissions('quotes.read') one(@CurrentUser()u:JwtPayload,@Param('id')id:string){return this.s.findOne(u.companyId,id)}
@Patch(':id') @Permissions('quotes.update') update(@CurrentUser()u:JwtPayload,@Param('id')id:string,@Body()d:UpdateQuoteDto){return this.s.update(u.companyId,id,d)}
@Post(':id/send') @Permissions('quotes.update') send(@CurrentUser()u:JwtPayload,@Param('id')id:string){return this.s.setStatus(u.companyId,id,'SENT')}
@Post(':id/approve') @Permissions('quotes.approve') approve(@CurrentUser()u:JwtPayload,@Param('id')id:string){return this.s.setStatus(u.companyId,id,'APPROVED')}
@Post(':id/reject') @Permissions('quotes.approve') reject(@CurrentUser()u:JwtPayload,@Param('id')id:string){return this.s.setStatus(u.companyId,id,'REJECTED')}
@Post(':id/cancel') @Permissions('quotes.update') cancel(@CurrentUser()u:JwtPayload,@Param('id')id:string){return this.s.setStatus(u.companyId,id,'CANCELLED')}
@Post(':id/convert/:number') @Permissions('quotes.convert') convert(@CurrentUser()u:JwtPayload,@Param('id')id:string,@Param('number')number:string){return this.s.convert(u.companyId,id,number)} }
