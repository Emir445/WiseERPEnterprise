import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { JwtPayload } from '../../core/auth/interfaces/jwt-payload.interface';
import { Permissions } from '../../core/permissions/decorators/permissions.decorator';
import { PermissionsGuard } from '../../core/permissions/guards/permissions.guard';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

@ApiTags('Dashboard')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @Permissions('dashboard.read')
  @ApiOperation({ summary: 'Resumo executivo do ERP' })
  summary(@CurrentUser() user: JwtPayload, @Query() query: DashboardQueryDto) {
    return this.dashboardService.summary(user.companyId, query);
  }
}
