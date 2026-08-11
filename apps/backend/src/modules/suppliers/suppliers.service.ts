import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../core/database/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { ListSuppliersQueryDto } from './dto/list-suppliers-query.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateSupplierDto) {
    const existing = await this.prisma.supplier.findFirst({
      where: {
        companyId,
        document: dto.document,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Já existe um fornecedor com este documento.',
      );
    }

    return this.prisma.supplier.create({
      data: {
        companyId,
        type: dto.type,
        name: dto.name,
        legalName: dto.legalName,
        tradeName: dto.tradeName,
        document: dto.document,
        stateRegistration: dto.stateRegistration,
        municipalRegistration: dto.municipalRegistration,
        email: dto.email?.toLowerCase(),
        phone: dto.phone,
        mobile: dto.mobile,
        notes: dto.notes,
        status: 'ACTIVE',
      },
    });
  }

  async findAll(
    companyId: string,
    query: ListSuppliersQueryDto,
  ) {
    const skip = (query.page - 1) * query.limit;

    const where = {
      companyId,
      deletedAt: null,
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              {
                name: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                document: {
                  contains: query.search,
                },
              },
              {
                email: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: {
          name: 'asc',
        },
      }),
      this.prisma.supplier.count({
        where,
      }),
    ]);

    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(companyId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });

    if (!supplier) {
      throw new NotFoundException(
        'Fornecedor não encontrado.',
      );
    }

    return supplier;
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdateSupplierDto,
  ) {
    await this.findOne(companyId, id);

    if (dto.document) {
      const existing = await this.prisma.supplier.findFirst({
        where: {
          companyId,
          document: dto.document,
          deletedAt: null,
          id: {
            not: id,
          },
        },
      });

      if (existing) {
        throw new ConflictException(
          'Já existe outro fornecedor com este documento.',
        );
      }
    }

    return this.prisma.supplier.update({
      where: {
        id,
      },
      data: {
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.legalName !== undefined
          ? { legalName: dto.legalName }
          : {}),
        ...(dto.tradeName !== undefined
          ? { tradeName: dto.tradeName }
          : {}),
        ...(dto.document !== undefined
          ? { document: dto.document }
          : {}),
        ...(dto.stateRegistration !== undefined
          ? { stateRegistration: dto.stateRegistration }
          : {}),
        ...(dto.municipalRegistration !== undefined
          ? { municipalRegistration: dto.municipalRegistration }
          : {}),
        ...(dto.email !== undefined
          ? { email: dto.email?.toLowerCase() }
          : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.mobile !== undefined ? { mobile: dto.mobile } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);

    await this.prisma.supplier.update({
      where: {
        id,
      },
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
