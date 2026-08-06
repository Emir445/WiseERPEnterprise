import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../core/database/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreatePermissionDto) {
    const existingPermission =
      await this.prisma.permission.findFirst({
        where: {
          companyId,
          code: dto.code,
        },
      });

    if (existingPermission) {
      throw new ConflictException(
        'Já existe uma permissão com este código.',
      );
    }

    return this.prisma.permission.create({
      data: {
        companyId,
        code: dto.code,
        description: dto.description,
        status: 'ACTIVE',
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.permission.findMany({
      where: {
        companyId,
      },
      orderBy: {
        code: 'asc',
      },
    });
  }

  async findOne(companyId: string, id: string) {
    const permission =
      await this.prisma.permission.findFirst({
        where: {
          id,
          companyId,
        },
      });

    if (!permission) {
      throw new NotFoundException(
        'Permissão não encontrada.',
      );
    }

    return permission;
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdatePermissionDto,
  ) {
    await this.findOne(companyId, id);

    return this.prisma.permission.update({
      where: {
        id,
      },
      data: {
        ...(dto.code !== undefined
          ? { code: dto.code }
          : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
      },
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);

    await this.prisma.permission.update({
      where: {
        id,
      },
      data: {
        status: 'INACTIVE',
      },
    });

    return {
      success: true,
    };
  }
}
