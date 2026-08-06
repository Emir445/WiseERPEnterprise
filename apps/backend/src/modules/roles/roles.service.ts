import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../core/database/prisma.service';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateRoleDto) {
    const existingRole = await this.prisma.role.findFirst({
      where: {
        companyId,
        name: dto.name,
      },
    });

    if (existingRole) {
      throw new ConflictException(
        'Já existe um perfil com este nome.',
      );
    }

    return this.prisma.role.create({
      data: {
        companyId,
        name: dto.name,
        description: dto.description,
        status: 'ACTIVE',
        grants: dto.permissionIds?.length
          ? {
              create: dto.permissionIds.map(
                (permissionId) => ({
                  permissionId,
                }),
              ),
            }
          : undefined,
      },
      include: {
        grants: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.role.findMany({
      where: {
        companyId,
      },
      orderBy: {
        name: 'asc',
      },
      include: {
        grants: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async findOne(companyId: string, id: string) {
    const role = await this.prisma.role.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        grants: {
          include: {
            permission: true,
          },
        },
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Perfil não encontrado.');
    }

    return role;
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdateRoleDto,
  ) {
    await this.findOne(companyId, id);

    return this.prisma.role.update({
      where: {
        id,
      },
      data: {
        ...(dto.name !== undefined
          ? { name: dto.name }
          : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
      },
      include: {
        grants: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async assignPermissions(
    companyId: string,
    id: string,
    dto: AssignPermissionsDto,
  ) {
    await this.findOne(companyId, id);

    const permissions = await this.prisma.permission.findMany({
      where: {
        companyId,
        id: {
          in: dto.permissionIds,
        },
      },
      select: {
        id: true,
      },
    });

    if (permissions.length !== dto.permissionIds.length) {
      throw new NotFoundException(
        'Uma ou mais permissões não foram encontradas.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({
        where: {
          roleId: id,
        },
      }),
      this.prisma.rolePermission.createMany({
        data: dto.permissionIds.map((permissionId) => ({
          roleId: id,
          permissionId,
        })),
      }),
    ]);

    return this.findOne(companyId, id);
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);

    await this.prisma.role.update({
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
