import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { JwtPayload } from '../../core/auth/interfaces/jwt-payload.interface';
import { Permissions } from '../../core/permissions/decorators/permissions.decorator';
import { PermissionsGuard } from '../../core/permissions/guards/permissions.guard';
import { ChartAccountsService } from './chart-accounts.service';
import { CreateChartAccountDto } from './dto/create-chart-account.dto';
import { UpdateChartAccountDto } from './dto/update-chart-account.dto';

@ApiTags('Plano de Contas')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('chart-accounts')
export class ChartAccountsController {
  constructor(private readonly service: ChartAccountsService) {}

  @Post() @Permissions('chart_accounts.create') @ApiOperation({ summary: 'Criar conta contábil' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateChartAccountDto) { return this.service.create(user.companyId, dto); }

  @Get() @Permissions('chart_accounts.read') @ApiOperation({ summary: 'Listar plano de contas' })
  findAll(@CurrentUser() user: JwtPayload) { return this.service.findAll(user.companyId); }

  @Get(':id') @Permissions('chart_accounts.read')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) { return this.service.findOne(user.companyId, id); }

  @Patch(':id') @Permissions('chart_accounts.update')
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateChartAccountDto) { return this.service.update(user.companyId, id, dto); }

  @Delete(':id') @Permissions('chart_accounts.delete')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) { return this.service.remove(user.companyId, id); }
}
