import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { JwtPayload } from '../../core/auth/interfaces/jwt-payload.interface';
import { Permissions } from '../../core/permissions/decorators/permissions.decorator';
import { PermissionsGuard } from '../../core/permissions/guards/permissions.guard';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { CreateCustomerReturnDto } from './dto/create-return.dto';
import { LogisticsService } from './logistics.service';

@ApiTags('Logística')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('logistics')
export class LogisticsController {
  constructor(private readonly service: LogisticsService) {}
  @Get('shipments') @Permissions('logistics.shipments.read') shipments(@CurrentUser() u: JwtPayload) { return this.service.findShipments(u.companyId); }
  @Post('shipments') @Permissions('logistics.shipments.create') createShipment(@CurrentUser() u: JwtPayload, @Body() d: CreateShipmentDto) { return this.service.createShipment(u.companyId, d); }
  @Post('shipments/:id/pick') @Permissions('logistics.shipments.pick') pick(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.service.pickShipment(u.companyId, id); }
  @Post('shipments/:id/ship') @Permissions('logistics.shipments.ship') ship(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.service.shipShipment(u.companyId, id); }
  @Post('shipments/:id/deliver') @Permissions('logistics.shipments.deliver') deliver(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.service.deliverShipment(u.companyId, id); }
  @Post('shipments/:id/cancel') @Permissions('logistics.shipments.cancel') cancelShipment(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.service.cancelShipment(u.companyId, id); }
  @Get('returns') @Permissions('logistics.returns.read') returns(@CurrentUser() u: JwtPayload) { return this.service.findReturns(u.companyId); }
  @Post('returns') @Permissions('logistics.returns.create') createReturn(@CurrentUser() u: JwtPayload, @Body() d: CreateCustomerReturnDto) { return this.service.createReturn(u.companyId, d); }
  @Post('returns/:id/receive') @Permissions('logistics.returns.receive') receiveReturn(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.service.receiveReturn(u.companyId, id); }
  @Post('returns/:id/cancel') @Permissions('logistics.returns.cancel') cancelReturn(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.service.cancelReturn(u.companyId, id); }
}
