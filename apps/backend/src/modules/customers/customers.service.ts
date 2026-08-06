import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../core/database/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateCustomerDto) {
    const existingCustomer = await this.prisma.customer.findFirst({
      where: {
        companyId,
        document: dto.document,
        deletedAt: null,
      },
    });

    if (existingCustomer) {
      throw new ConflictException(
        'Já existe um cliente com este documento.',
      );
    }

    return this.prisma.customer.create({
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
    query: ListCustomersQueryDto,
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
      this.prisma.customer.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: {
          name: 'asc',
        },
      }),
      this.prisma.customer.count({
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
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    return customer;
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdateCustomerDto,
  ) {
    await this.findOne(companyId, id);

    if (dto.document) {
      const existingCustomer = await this.prisma.customer.findFirst({
        where: {
          companyId,
          document: dto.document,
          deletedAt: null,
          id: {
            not: id,
          },
        },
      });

      if (existingCustomer) {
        throw new ConflictException(
          'Já existe outro cliente com este documento.',
        );
      }
    }

    return this.prisma.customer.update({
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
          ? {
              municipalRegistration:
                dto.municipalRegistration,
            }
          : {}),
        ...(dto.email !== undefined
          ? { email: dto.email?.toLowerCase() }
          : {}),
        ...(dto.phone !== undefined
          ? { phone: dto.phone }
          : {}),
        ...(dto.mobile !== undefined
          ? { mobile: dto.mobile }
          : {}),
        ...(dto.notes !== undefined
          ? { notes: dto.notes }
          : {}),
      },
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);

    await this.prisma.customer.update({
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
