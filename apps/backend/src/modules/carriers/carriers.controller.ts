import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { JwtPayload } from '../../core/auth/interfaces/jwt-payload.interface';
import { Permissions } from '../../core/permissions/decorators/permissions.decorator';
import { PermissionsGuard } from '../../core/permissions/guards/permissions.guard';
import { CarriersService } from './carriers.service';
import { CreateCarrierDto } from './dto/create-carrier.dto';
import { UpdateCarrierDto } from './dto/update-carrier.dto';

@ApiTags('Transportadoras')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('carriers')
export class CarriersController {
  constructor(private readonly service: CarriersService) {}
  @Post() @Permissions('carriers.create') create(@CurrentUser() u: JwtPayload, @Body() d: CreateCarrierDto) { return this.service.create(u.companyId, d); }
  @Get() @Permissions('carriers.read') all(@CurrentUser() u: JwtPayload) { return this.service.findAll(u.companyId); }
  @Get(':id') @Permissions('carriers.read') one(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.service.findOne(u.companyId, id); }
  @Patch(':id') @Permissions('carriers.update') update(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() d: UpdateCarrierDto) { return this.service.update(u.companyId, id, d); }
  @Delete(':id') @Permissions('carriers.delete') remove(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.service.remove(u.companyId, id); }
}
