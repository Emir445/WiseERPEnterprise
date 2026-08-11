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
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('Produtos')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
  ) {}

  @Post()
  @Permissions('products.create')
  @ApiOperation({ summary: 'Criar produto' })
  create(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(
      currentUser.companyId,
      dto,
    );
  }

  @Get()
  @Permissions('products.read')
  @ApiOperation({ summary: 'Listar produtos' })
  findAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query() query: ListProductsQueryDto,
  ) {
    return this.productsService.findAll(
      currentUser.companyId,
      query,
    );
  }

  @Get(':id')
  @Permissions('products.read')
  @ApiOperation({ summary: 'Consultar produto' })
  findOne(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.productsService.findOne(
      currentUser.companyId,
      id,
    );
  }

  @Patch(':id')
  @Permissions('products.update')
  @ApiOperation({ summary: 'Atualizar produto' })
  update(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(
      currentUser.companyId,
      id,
      dto,
    );
  }

  @Delete(':id')
  @Permissions('products.delete')
  @ApiOperation({ summary: 'Inativar produto' })
  remove(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.productsService.remove(
      currentUser.companyId,
      id,
    );
  }
}
