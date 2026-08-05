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
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Usuários')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Criar usuário' })
  create(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.create(
      currentUser.companyId,
      dto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar usuários' })
  findAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query() query: ListUsersQueryDto,
  ) {
    return this.usersService.findAll(
      currentUser.companyId,
      query,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar usuário' })
  findOne(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.usersService.findOne(
      currentUser.companyId,
      id,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar usuário' })
  update(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(
      currentUser.companyId,
      id,
      dto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Inativar usuário' })
  remove(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.usersService.remove(
      currentUser.companyId,
      id,
    );
  }
}
