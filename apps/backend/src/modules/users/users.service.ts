import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../core/database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateUserDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        companyId,
        email: dto.email.toLowerCase(),
        deletedAt: null,
      },
    });

    if (existingUser) {
      throw new ConflictException('Já existe um usuário com este e-mail.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: {
        companyId,
        branchId: dto.branchId,
        name: dto.name,
        email: dto.email.toLowerCase(),
        passwordHash,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        branchId: true,
        createdAt: true,
      },
    });
  }

  async findAll(companyId: string, query: ListUsersQueryDto) {
    const users = await this.prisma.user.findMany({
      where: {
        companyId,
        deletedAt: null,
        ...(query.search
          ? {
              OR: [
                {
                  name: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
                {
                  email: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        branchId: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    return {
      data: users,
      total: users.length,
    };
  }

  async findOne(companyId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        branchId: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdateUserDto,
  ) {
    await this.findOne(companyId, id);

    const data: Record<string, unknown> = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.email !== undefined
        ? { email: dto.email.toLowerCase() }
        : {}),
      ...(dto.branchId !== undefined
        ? { branchId: dto.branchId }
        : {}),
    };

    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 12);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        branchId: true,
        updatedAt: true,
      },
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);

    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'INACTIVE',
      },
    });

    return {
      success: true,
    };
  }
}
