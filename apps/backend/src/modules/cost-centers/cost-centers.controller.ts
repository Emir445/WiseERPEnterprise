import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { JwtPayload } from '../../core/auth/interfaces/jwt-payload.interface';
import { Permissions } from '../../core/permissions/decorators/permissions.decorator';
import { PermissionsGuard } from '../../core/permissions/guards/permissions.guard';
import { CostCentersService } from './cost-centers.service';
import { CreateCostCenterDto } from './dto/create-cost-center.dto';
import { UpdateCostCenterDto } from './dto/update-cost-center.dto';

@ApiTags('Centros de Custo') @ApiBearerAuth('bearer') @UseGuards(JwtAuthGuard, PermissionsGuard) @Controller('cost-centers')
export class CostCentersController {
  constructor(private readonly service: CostCentersService) {}
  @Post() @Permissions('cost_centers.create') create(@CurrentUser() u: JwtPayload, @Body() dto: CreateCostCenterDto) { return this.service.create(u.companyId, dto); }
  @Get() @Permissions('cost_centers.read') findAll(@CurrentUser() u: JwtPayload) { return this.service.findAll(u.companyId); }
  @Get(':id') @Permissions('cost_centers.read') findOne(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.service.findOne(u.companyId, id); }
  @Patch(':id') @Permissions('cost_centers.update') update(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() dto: UpdateCostCenterDto) { return this.service.update(u.companyId, id, dto); }
  @Delete(':id') @Permissions('cost_centers.delete') remove(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.service.remove(u.companyId, id); }
}
