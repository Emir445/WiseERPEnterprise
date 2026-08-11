import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { JwtPayload } from '../../core/auth/interfaces/jwt-payload.interface';
import { Permissions } from '../../core/permissions/decorators/permissions.decorator';
import { PermissionsGuard } from '../../core/permissions/guards/permissions.guard';
import { OperationsReportQueryDto } from './dto/operations-report-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('Relatórios')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @Permissions('reports.read')
  @ApiOperation({ summary: 'Resumo operacional do ERP' })
  summary(
    @CurrentUser() user: JwtPayload,
    @Query() query: OperationsReportQueryDto,
  ) {
    return this.reportsService.summary(user.companyId, query);
  }

  @Get('low-stock')
  @Permissions('reports.read')
  @ApiOperation({ summary: 'Produtos com estoque baixo' })
  lowStock(
    @CurrentUser() user: JwtPayload,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.lowStock(user.companyId, branchId);
  }
}
