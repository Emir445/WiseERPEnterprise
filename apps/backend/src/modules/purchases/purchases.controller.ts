import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { ListPurchasesQueryDto } from './dto/list-purchases-query.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { PurchasesService } from './purchases.service';

@ApiTags('Compras')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(
    private readonly purchasesService: PurchasesService,
  ) {}

  @Post()
  @Permissions('purchases.create')
  @ApiOperation({ summary: 'Criar compra' })
  create(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreatePurchaseDto,
  ) {
    return this.purchasesService.create(
      currentUser.companyId,
      dto,
    );
  }

  @Get()
  @Permissions('purchases.read')
  @ApiOperation({ summary: 'Listar compras' })
  findAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query() query: ListPurchasesQueryDto,
  ) {
    return this.purchasesService.findAll(
      currentUser.companyId,
      query,
    );
  }

  @Get(':id')
  @Permissions('purchases.read')
  @ApiOperation({ summary: 'Consultar compra' })
  findOne(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.purchasesService.findOne(
      currentUser.companyId,
      id,
    );
  }

  @Patch(':id')
  @Permissions('purchases.update')
  @ApiOperation({ summary: 'Atualizar compra em rascunho' })
  update(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseDto,
  ) {
    return this.purchasesService.update(
      currentUser.companyId,
      id,
      dto,
    );
  }

  @Post(':id/confirm')
  @Permissions('purchases.confirm')
  @ApiOperation({
    summary: 'Confirmar compra e gerar entrada no estoque',
  })
  confirm(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.purchasesService.confirm(
      currentUser.companyId,
      id,
    );
  }

  @Post(':id/cancel')
  @Permissions('purchases.cancel')
  @ApiOperation({ summary: 'Cancelar compra em rascunho' })
  cancel(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.purchasesService.cancel(
      currentUser.companyId,
      id,
    );
  }
}
