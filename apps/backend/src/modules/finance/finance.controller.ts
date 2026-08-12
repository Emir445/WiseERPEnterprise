import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { JwtPayload } from '../../core/auth/interfaces/jwt-payload.interface';
import { Permissions } from '../../core/permissions/decorators/permissions.decorator';
import { PermissionsGuard } from '../../core/permissions/guards/permissions.guard';
import { CreateFinancialEntryDto } from './dto/create-financial-entry.dto';
import { ListFinancialEntriesQueryDto } from './dto/list-financial-entries-query.dto';
import { SettleFinancialEntryDto } from './dto/settle-financial-entry.dto';
import { FinanceService } from './finance.service';

@ApiTags('Financeiro')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('entries')
  @Permissions('finance.create')
  @ApiOperation({ summary: 'Criar lançamento financeiro manual' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateFinancialEntryDto) {
    return this.financeService.create(user.companyId, dto);
  }

  @Get('entries')
  @Permissions('finance.read')
  @ApiOperation({ summary: 'Listar contas a receber e a pagar' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: ListFinancialEntriesQueryDto) {
    return this.financeService.findAll(user.companyId, query);
  }

  @Get('summary')
  @Permissions('finance.read')
  @ApiOperation({ summary: 'Resumo financeiro' })
  summary(@CurrentUser() user: JwtPayload) { return this.financeService.summary(user.companyId); }

  @Get('entries/:id')
  @Permissions('finance.read')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) { return this.financeService.findOne(user.companyId, id); }

  @Get('entries/:id/settlements')
  @Permissions('finance.read')
  settlements(@CurrentUser() user: JwtPayload, @Param('id') id: string) { return this.financeService.settlements(user.companyId, id); }

  @Post('entries/:id/settle')
  @Permissions('finance.settle')
  @ApiOperation({ summary: 'Registrar baixa total ou parcial' })
  settle(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: SettleFinancialEntryDto) {
    return this.financeService.settle(user.companyId, id, dto);
  }

  @Post('entries/:id/cancel')
  @Permissions('finance.cancel')
  cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string) { return this.financeService.cancel(user.companyId, id); }
}
