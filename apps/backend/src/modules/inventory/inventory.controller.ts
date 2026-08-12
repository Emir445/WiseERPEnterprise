import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { JwtPayload } from '../../core/auth/interfaces/jwt-payload.interface';
import { Permissions } from '../../core/permissions/decorators/permissions.decorator';
import { PermissionsGuard } from '../../core/permissions/guards/permissions.guard';
import { CreateInventoryTransferDto } from './dto/create-inventory-transfer.dto';
import { InventoryAdjustmentDto } from './dto/inventory-adjustment.dto';
import { InventoryEntryDto } from './dto/inventory-entry.dto';
import { InventoryExitDto } from './dto/inventory-exit.dto';
import { ListInventoryQueryDto } from './dto/list-inventory-query.dto';
import { ListInventoryTransfersQueryDto } from './dto/list-inventory-transfers-query.dto';
import { InventoryService } from './inventory.service';

@ApiTags('Estoque')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
  ) {}

  @Get()
  @Permissions('inventory.read')
  @ApiOperation({
    summary: 'Consultar saldos de estoque',
  })
  findAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query() query: ListInventoryQueryDto,
  ) {
    return this.inventoryService.findAll(
      currentUser.companyId,
      query,
    );
  }

  @Get('movements')
  @Permissions('inventory.read')
  @ApiOperation({
    summary: 'Consultar movimentações de estoque',
  })
  findMovements(
    @CurrentUser() currentUser: JwtPayload,
    @Query('productId') productId?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.inventoryService.findMovements(
      currentUser.companyId,
      productId,
      branchId,
    );
  }


  @Get('transfers')
  @Permissions('inventory.transfer')
  @ApiOperation({
    summary: 'Listar transferências de estoque',
  })
  findTransfers(
    @CurrentUser() currentUser: JwtPayload,
    @Query() query: ListInventoryTransfersQueryDto,
  ) {
    return this.inventoryService.findTransfers(
      currentUser.companyId,
      query,
    );
  }

  @Post('transfers')
  @Permissions('inventory.transfer')
  @ApiOperation({
    summary: 'Transferir estoque entre filiais',
  })
  transfer(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateInventoryTransferDto,
  ) {
    return this.inventoryService.transfer(
      currentUser.companyId,
      dto,
    );
  }

  @Post('transfers/:id/cancel')
  @Permissions('inventory.transfer')
  @ApiOperation({
    summary: 'Cancelar transferência e reverter o estoque',
  })
  cancelTransfer(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.inventoryService.cancelTransfer(
      currentUser.companyId,
      id,
    );
  }

  @Post('entry')
  @Permissions('inventory.entry')
  @ApiOperation({
    summary: 'Registrar entrada de estoque',
  })
  entry(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: InventoryEntryDto,
  ) {
    return this.inventoryService.entry(
      currentUser.companyId,
      dto,
    );
  }

  @Post('exit')
  @Permissions('inventory.exit')
  @ApiOperation({
    summary: 'Registrar saída de estoque',
  })
  exit(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: InventoryExitDto,
  ) {
    return this.inventoryService.exit(
      currentUser.companyId,
      dto,
    );
  }

  @Post('adjustment')
  @Permissions('inventory.adjustment')
  @ApiOperation({
    summary: 'Ajustar saldo físico de estoque',
  })
  adjustment(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: InventoryAdjustmentDto,
  ) {
    return this.inventoryService.adjustment(
      currentUser.companyId,
      dto,
    );
  }
}
