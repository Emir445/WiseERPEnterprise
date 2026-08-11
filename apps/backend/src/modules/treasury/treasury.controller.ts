import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { JwtPayload } from '../../core/auth/interfaces/jwt-payload.interface';
import { Permissions } from '../../core/permissions/decorators/permissions.decorator';
import { PermissionsGuard } from '../../core/permissions/guards/permissions.guard';
import { AdjustTreasuryAccountDto } from './dto/adjust-treasury-account.dto';
import { CashFlowQueryDto } from './dto/cash-flow-query.dto';
import { CloseCashSessionDto } from './dto/close-cash-session.dto';
import { CreateTreasuryAccountDto } from './dto/create-treasury-account.dto';
import { CreateTreasuryTransferDto } from './dto/create-treasury-transfer.dto';
import { ListTreasuryMovementsQueryDto } from './dto/list-treasury-movements-query.dto';
import { OpenCashSessionDto } from './dto/open-cash-session.dto';
import { ReconcileTreasuryMovementsDto } from './dto/reconcile-treasury-movements.dto';
import { UpdateTreasuryAccountDto } from './dto/update-treasury-account.dto';
import { TreasuryService } from './treasury.service';

@ApiTags('Tesouraria')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('treasury')
export class TreasuryController {
  constructor(private readonly service: TreasuryService) {}

  @Post('accounts') @Permissions('treasury.accounts.create') @ApiOperation({ summary: 'Criar conta bancária ou caixa' })
  createAccount(@CurrentUser() u: JwtPayload, @Body() dto: CreateTreasuryAccountDto) { return this.service.createAccount(u.companyId, dto); }
  @Get('accounts') @Permissions('treasury.accounts.read') findAccounts(@CurrentUser() u: JwtPayload) { return this.service.findAccounts(u.companyId); }
  @Get('accounts/:id') @Permissions('treasury.accounts.read') findAccount(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.service.findAccount(u.companyId, id); }
  @Patch('accounts/:id') @Permissions('treasury.accounts.update') updateAccount(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() dto: UpdateTreasuryAccountDto) { return this.service.updateAccount(u.companyId, id, dto); }
  @Delete('accounts/:id') @Permissions('treasury.accounts.delete') removeAccount(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.service.removeAccount(u.companyId, id); }
  @Post('accounts/:id/adjust') @Permissions('treasury.adjust') adjust(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() dto: AdjustTreasuryAccountDto) { return this.service.adjustAccount(u.companyId, id, dto); }

  @Post('transfers') @Permissions('treasury.transfer') @ApiOperation({ summary: 'Transferir valores entre contas' })
  transfer(@CurrentUser() u: JwtPayload, @Body() dto: CreateTreasuryTransferDto) { return this.service.transfer(u.companyId, dto); }

  @Get('movements') @Permissions('treasury.read') movements(@CurrentUser() u: JwtPayload, @Query() q: ListTreasuryMovementsQueryDto) { return this.service.movements(u.companyId, q); }
  @Post('movements/reconcile') @Permissions('treasury.reconcile') reconcile(@CurrentUser() u: JwtPayload, @Body() dto: ReconcileTreasuryMovementsDto) { return this.service.reconcile(u.companyId, dto); }

  @Post('cash-sessions/open') @Permissions('treasury.cash.open') openCash(@CurrentUser() u: JwtPayload, @Body() dto: OpenCashSessionDto) { return this.service.openCashSession(u.companyId, u.sub, dto); }
  @Post('cash-sessions/:id/close') @Permissions('treasury.cash.close') closeCash(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() dto: CloseCashSessionDto) { return this.service.closeCashSession(u.companyId, u.sub, id, dto); }
  @Get('cash-sessions') @Permissions('treasury.cash.read') cashSessions(@CurrentUser() u: JwtPayload) { return this.service.findCashSessions(u.companyId); }

  @Get('cash-flow') @Permissions('treasury.read') cashFlow(@CurrentUser() u: JwtPayload, @Query() q: CashFlowQueryDto) { return this.service.cashFlow(u.companyId, q); }
}
