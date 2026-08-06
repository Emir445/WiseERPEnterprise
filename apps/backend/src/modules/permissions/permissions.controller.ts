import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionsService } from './permissions.service';

@ApiTags('Permissões')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(
    private readonly permissionsService: PermissionsService,
  ) {}

  @Post()
  @Permissions('permissions.create')
  @ApiOperation({
    summary: 'Criar permissão',
  })
  create(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreatePermissionDto,
  ) {
    return this.permissionsService.create(
      currentUser.companyId,
      dto,
    );
  }

  @Get()
  @Permissions('permissions.read')
  @ApiOperation({
    summary: 'Listar permissões',
  })
  findAll(@CurrentUser() currentUser: JwtPayload) {
    return this.permissionsService.findAll(
      currentUser.companyId,
    );
  }

  @Get(':id')
  @Permissions('permissions.read')
  @ApiOperation({
    summary: 'Consultar permissão',
  })
  findOne(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.permissionsService.findOne(
      currentUser.companyId,
      id,
    );
  }

  @Patch(':id')
  @Permissions('permissions.update')
  @ApiOperation({
    summary: 'Atualizar permissão',
  })
  update(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(
      currentUser.companyId,
      id,
      dto,
    );
  }

  @Delete(':id')
  @Permissions('permissions.delete')
  @ApiOperation({
    summary: 'Inativar permissão',
  })
  remove(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.permissionsService.remove(
      currentUser.companyId,
      id,
    );
  }
}
