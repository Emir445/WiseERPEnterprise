import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { JwtPayload } from '../../core/auth/interfaces/jwt-payload.interface';
import { Permissions } from '../../core/permissions/decorators/permissions.decorator';
import { PermissionsGuard } from '../../core/permissions/guards/permissions.guard';
import { CreatePaymentTermDto } from './dto/create-payment-term.dto';
import { UpdatePaymentTermDto } from './dto/update-payment-term.dto';
import { PaymentTermsService } from './payment-terms.service';

@ApiTags('Condições de pagamento')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('payment-terms')
export class PaymentTermsController {
  constructor(private readonly service: PaymentTermsService) {}
  @Post() @Permissions('payment_terms.create') create(@CurrentUser() u: JwtPayload, @Body() dto: CreatePaymentTermDto) { return this.service.create(u.companyId, dto); }
  @Get() @Permissions('payment_terms.read') findAll(@CurrentUser() u: JwtPayload) { return this.service.findAll(u.companyId); }
  @Get(':id') @Permissions('payment_terms.read') findOne(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.service.findOne(u.companyId, id); }
  @Patch(':id') @Permissions('payment_terms.update') update(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() dto: UpdatePaymentTermDto) { return this.service.update(u.companyId, id, dto); }
  @Delete(':id') @Permissions('payment_terms.delete') remove(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.service.remove(u.companyId, id); }
}
