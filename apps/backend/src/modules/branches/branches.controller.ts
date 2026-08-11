import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { JwtPayload } from '../../core/auth/interfaces/jwt-payload.interface';
import { Permissions } from '../../core/permissions/decorators/permissions.decorator';
import { PermissionsGuard } from '../../core/permissions/guards/permissions.guard';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { ListBranchesQueryDto } from './dto/list-branches-query.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@ApiTags('Filiais')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @Permissions('branches.create')
  @ApiOperation({ summary: 'Criar filial' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBranchDto) {
    return this.branchesService.create(user.companyId, dto);
  }

  @Get()
  @Permissions('branches.read')
  @ApiOperation({ summary: 'Listar filiais' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: ListBranchesQueryDto) {
    return this.branchesService.findAll(user.companyId, query);
  }

  @Get(':id')
  @Permissions('branches.read')
  @ApiOperation({ summary: 'Consultar filial' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.branchesService.findOne(user.companyId, id);
  }

  @Patch(':id')
  @Permissions('branches.update')
  @ApiOperation({ summary: 'Atualizar filial' })
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.branchesService.update(user.companyId, id, dto);
  }

  @Delete(':id')
  @Permissions('branches.delete')
  @ApiOperation({ summary: 'Inativar filial' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.branchesService.remove(user.companyId, id);
  }
}
