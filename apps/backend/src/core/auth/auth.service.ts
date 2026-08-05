import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';

import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

type RequestContext = {
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto, context: RequestContext) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email.toLowerCase(),
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        company: true,
        branch: true,
        userRoles: {
          include: {
            role: {
              include: {
                grants: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const validPassword = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!validPassword) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const sessionId = randomUUID();

    const payload: JwtPayload = {
      sub: user.id,
      companyId: user.companyId,
      branchId: user.branchId ?? undefined,
      sessionId,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.getRequired('JWT_ACCESS_SECRET'),
      expiresIn: (this.configService.get<string>(
        'JWT_ACCESS_EXPIRES_IN',
      ) ?? '15m') as never,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.getRequired('JWT_REFRESH_SECRET'),
      expiresIn: (this.configService.get<string>(
        'JWT_REFRESH_EXPIRES_IN',
      ) ?? '7d') as never,
    });

    const decodedRefresh = this.jwtService.decode(refreshToken) as {
      exp?: number;
    };

    const expiresAt = decodedRefresh.exp
      ? new Date(decodedRefresh.exp * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.session.create({
        data: {
          id: sessionId,
          companyId: user.companyId,
          userId: user.id,
          refreshTokenHash: this.hashToken(refreshToken),
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          expiresAt,
        },
      }),
      this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          lastLoginAt: new Date(),
        },
      }),
    ]);

    const permissions = Array.from(
      new Set(
        user.userRoles.flatMap((userRole) =>
          userRole.role.grants.map(
            (grant) => grant.permission.code,
          ),
        ),
      ),
    ).sort();

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company: {
          id: user.company.id,
          legalName: user.company.legalName,
          tradeName: user.company.tradeName,
        },
        branch: user.branch
          ? {
              id: user.branch.id,
              name: user.branch.name,
              code: user.branch.code,
            }
          : null,
        roles: user.userRoles.map(
          (userRole) => userRole.role.name,
        ),
        permissions,
      },
    };
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.getRequired('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException(
        'Refresh token inválido ou expirado.',
      );
    }

    const session = await this.prisma.session.findFirst({
      where: {
        id: payload.sessionId,
        userId: payload.sub,
        companyId: payload.companyId,
        refreshTokenHash: this.hashToken(refreshToken),
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!session) {
      throw new UnauthorizedException(
        'Sessão inválida ou encerrada.',
      );
    }

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.getRequired('JWT_ACCESS_SECRET'),
      expiresIn: (this.configService.get<string>(
        'JWT_ACCESS_EXPIRES_IN',
      ) ?? '15m') as never,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
    };
  }

  async logout(
    refreshToken: string,
  ): Promise<{ success: true }> {
    await this.prisma.session.updateMany({
      where: {
        refreshTokenHash: this.hashToken(refreshToken),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      success: true,
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        lastLoginAt: true,
        company: {
          select: {
            id: true,
            legalName: true,
            tradeName: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Usuário não encontrado.',
      );
    }

    return user;
  }

  private hashToken(token: string): string {
    return createHash('sha256')
      .update(token)
      .digest('hex');
  }

  private getRequired(key: string): string {
    const value = this.configService.get<string>(key);

    if (!value) {
      throw new Error(
        `${key} não foi configurado no arquivo .env.`,
      );
    }

    return value;
  }
}
