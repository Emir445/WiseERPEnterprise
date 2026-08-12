import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { JwtPayload } from '../../core/auth/interfaces/jwt-payload.interface';
import { Permissions } from '../../core/permissions/decorators/permissions.decorator';
import { PermissionsGuard } from '../../core/permissions/guards/permissions.guard';
import { CreateSaleDto } from './dto/create-sale.dto';
import { ListSalesQueryDto } from './dto/list-sales-query.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { SalesService } from './sales.service';

@ApiTags('Vendas')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Permissions('sales.create')
  @ApiOperation({ summary: 'Criar venda' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateSaleDto) {
    return this.salesService.create(user.companyId, dto);
  }

  @Get()
  @Permissions('sales.read')
  @ApiOperation({ summary: 'Listar vendas' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: ListSalesQueryDto) {
    return this.salesService.findAll(user.companyId, query);
  }

  @Get(':id')
  @Permissions('sales.read')
  @ApiOperation({ summary: 'Consultar venda' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.salesService.findOne(user.companyId, id);
  }

  @Patch(':id')
  @Permissions('sales.update')
  @ApiOperation({ summary: 'Atualizar venda em rascunho' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSaleDto,
  ) {
    return this.salesService.update(user.companyId, id, dto);
  }

  @Post(':id/confirm')
  @Permissions('sales.confirm')
  @ApiOperation({ summary: 'Confirmar venda e gerar saída no estoque' })
  confirm(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.salesService.confirm(user.companyId, id);
  }

  @Post(':id/cancel')
  @Permissions('sales.cancel')
  @ApiOperation({ summary: 'Cancelar venda em rascunho' })
  cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.salesService.cancel(user.companyId, id);
  }
}
