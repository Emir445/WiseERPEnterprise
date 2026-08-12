import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { JwtPayload } from '../../core/auth/interfaces/jwt-payload.interface';
import { Permissions } from '../../core/permissions/decorators/permissions.decorator';
import { PermissionsGuard } from '../../core/permissions/guards/permissions.guard';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { ListProductCategoriesQueryDto } from './dto/list-product-categories-query.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { ProductCategoriesService } from './product-categories.service';

@ApiTags('Categorias de Produtos')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('product-categories')
export class ProductCategoriesController {
  constructor(private readonly service: ProductCategoriesService) {}

  @Post()
  @Permissions('product_categories.create')
  @ApiOperation({ summary: 'Criar categoria de produto' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateProductCategoryDto) {
    return this.service.create(user.companyId, dto);
  }

  @Get()
  @Permissions('product_categories.read')
  @ApiOperation({ summary: 'Listar categorias de produtos' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: ListProductCategoriesQueryDto) {
    return this.service.findAll(user.companyId, query);
  }

  @Get(':id')
  @Permissions('product_categories.read')
  @ApiOperation({ summary: 'Consultar categoria de produto' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.findOne(user.companyId, id);
  }

  @Patch(':id')
  @Permissions('product_categories.update')
  @ApiOperation({ summary: 'Atualizar categoria de produto' })
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateProductCategoryDto) {
    return this.service.update(user.companyId, id, dto);
  }

  @Delete(':id')
  @Permissions('product_categories.delete')
  @ApiOperation({ summary: 'Inativar categoria de produto' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.remove(user.companyId, id);
  }
}
