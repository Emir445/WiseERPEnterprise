import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
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
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@ApiTags('Perfis')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Permissions('roles.create')
  @ApiOperation({ summary: 'Criar perfil' })
  create(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateRoleDto,
  ) {
    return this.rolesService.create(
      currentUser.companyId,
      dto,
    );
  }

  @Get()
  @Permissions('roles.read')
  @ApiOperation({ summary: 'Listar perfis' })
  findAll(@CurrentUser() currentUser: JwtPayload) {
    return this.rolesService.findAll(
      currentUser.companyId,
    );
  }

  @Get(':id')
  @Permissions('roles.read')
  @ApiOperation({ summary: 'Consultar perfil' })
  findOne(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.rolesService.findOne(
      currentUser.companyId,
      id,
    );
  }

  @Patch(':id')
  @Permissions('roles.update')
  @ApiOperation({ summary: 'Atualizar perfil' })
  update(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.update(
      currentUser.companyId,
      id,
      dto,
    );
  }

  @Put(':id/permissions')
  @Permissions('roles.assign_permissions')
  @ApiOperation({
    summary: 'Definir permissões do perfil',
  })
  assignPermissions(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissions(
      currentUser.companyId,
      id,
      dto,
    );
  }

  @Delete(':id')
  @Permissions('roles.delete')
  @ApiOperation({ summary: 'Inativar perfil' })
  remove(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.rolesService.remove(
      currentUser.companyId,
      id,
    );
  }
}
