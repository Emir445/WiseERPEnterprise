import {
  Body,
  Controller,
  Delete,
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
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { ListSuppliersQueryDto } from './dto/list-suppliers-query.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SuppliersService } from './suppliers.service';

@ApiTags('Fornecedores')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(
    private readonly suppliersService: SuppliersService,
  ) {}

  @Post()
  @Permissions('suppliers.create')
  @ApiOperation({ summary: 'Criar fornecedor' })
  create(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateSupplierDto,
  ) {
    return this.suppliersService.create(
      currentUser.companyId,
      dto,
    );
  }

  @Get()
  @Permissions('suppliers.read')
  @ApiOperation({ summary: 'Listar fornecedores' })
  findAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query() query: ListSuppliersQueryDto,
  ) {
    return this.suppliersService.findAll(
      currentUser.companyId,
      query,
    );
  }

  @Get(':id')
  @Permissions('suppliers.read')
  @ApiOperation({ summary: 'Consultar fornecedor' })
  findOne(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.suppliersService.findOne(
      currentUser.companyId,
      id,
    );
  }

  @Patch(':id')
  @Permissions('suppliers.update')
  @ApiOperation({ summary: 'Atualizar fornecedor' })
  update(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(
      currentUser.companyId,
      id,
      dto,
    );
  }

  @Delete(':id')
  @Permissions('suppliers.delete')
  @ApiOperation({ summary: 'Inativar fornecedor' })
  remove(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.suppliersService.remove(
      currentUser.companyId,
      id,
    );
  }
}
