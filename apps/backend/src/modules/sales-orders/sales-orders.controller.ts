import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { JwtPayload } from '../../core/auth/interfaces/jwt-payload.interface';
import { Permissions } from '../../core/permissions/decorators/permissions.decorator';
import { PermissionsGuard } from '../../core/permissions/guards/permissions.guard';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { ListSalesOrdersQueryDto } from './dto/list-sales-orders-query.dto';
import { SalesOrdersService } from './sales-orders.service';

@ApiTags('Pedidos de venda')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('sales-orders')
export class SalesOrdersController {
  constructor(private readonly service: SalesOrdersService) {}
  @Post() @Permissions('sales_orders.create') create(@CurrentUser() u: JwtPayload, @Body() d: CreateSalesOrderDto) { return this.service.create(u.companyId, d); }
  @Get() @Permissions('sales_orders.read') all(@CurrentUser() u: JwtPayload, @Query() q: ListSalesOrdersQueryDto) { return this.service.all(u.companyId, q); }
  @Get(':id') @Permissions('sales_orders.read') one(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.service.one(u.companyId, id); }
  @Post(':id/confirm') @Permissions('sales_orders.confirm') confirm(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.service.confirm(u.companyId, id); }
  @Post(':id/reserve') @Permissions('sales_orders.reserve') reserve(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.service.reserve(u.companyId, id); }
  @Post(':id/release-reservation') @Permissions('sales_orders.reserve') release(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.service.releaseReservation(u.companyId, id); }
  @Post(':id/cancel') @Permissions('sales_orders.cancel') cancel(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.service.cancel(u.companyId, id); }
  @Post(':id/convert/:number') @Permissions('sales_orders.convert') convert(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Param('number') n: string) { return this.service.convertToSale(u.companyId, id, n); }
}
