import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PrismaService } from '../../database/prisma.service';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(
        PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user: JwtPayload }>();

    const currentUser = request.user;

    if (!currentUser?.sub || !currentUser.companyId) {
      throw new ForbiddenException(
        'Usuário autenticado não identificado.',
      );
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: currentUser.sub,
        companyId: currentUser.companyId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        userRoles: {
          select: {
            role: {
              select: {
                status: true,
                grants: {
                  select: {
                    permission: {
                      select: {
                        code: true,
                        status: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new ForbiddenException('Usuário não encontrado.');
    }

    const grantedPermissions = new Set(
      user.userRoles
        .filter((userRole) => userRole.role.status === 'ACTIVE')
        .flatMap((userRole) =>
          userRole.role.grants
            .filter(
              (grant) => grant.permission.status === 'ACTIVE',
            )
            .map((grant) => grant.permission.code),
        ),
    );

    const hasAllPermissions = requiredPermissions.every(
      (permission) => grantedPermissions.has(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        'Você não possui permissão para realizar esta ação.',
      );
    }

    return true;
  }
}
