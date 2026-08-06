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
import { CreateCustomerDto } from './dto/create-customer.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersService } from './customers.service';

@ApiTags('Clientes')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
  ) {}

  @Post()
  @Permissions('customers.create')
  @ApiOperation({
    summary: 'Criar cliente',
  })
  create(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customersService.create(
      currentUser.companyId,
      dto,
    );
  }

  @Get()
  @Permissions('customers.read')
  @ApiOperation({
    summary: 'Listar clientes',
  })
  findAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query() query: ListCustomersQueryDto,
  ) {
    return this.customersService.findAll(
      currentUser.companyId,
      query,
    );
  }

  @Get(':id')
  @Permissions('customers.read')
  @ApiOperation({
    summary: 'Consultar cliente',
  })
  findOne(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.customersService.findOne(
      currentUser.companyId,
      id,
    );
  }

  @Patch(':id')
  @Permissions('customers.update')
  @ApiOperation({
    summary: 'Atualizar cliente',
  })
  update(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(
      currentUser.companyId,
      id,
      dto,
    );
  }

  @Delete(':id')
  @Permissions('customers.delete')
  @ApiOperation({
    summary: 'Inativar cliente',
  })
  remove(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.customersService.remove(
      currentUser.companyId,
      id,
    );
  }
}

