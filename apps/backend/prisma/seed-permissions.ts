import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const company = await prisma.company.findUnique({
    where: {
      document: '00000000000100',
    },
  });

  if (!company) {
    throw new Error('Empresa inicial não encontrada.');
  }

  const role = await prisma.role.findUnique({
    where: {
      companyId_name: {
        companyId: company.id,
        name: 'Administrador',
      },
    },
  });

  if (!role) {
    throw new Error('Perfil Administrador não encontrado.');
  }

  const permissionCodes = [
    'users.create',
    'users.read',
    'users.update',
    'users.delete',
    'roles.create',
    'roles.read',
    'roles.update',
    'roles.delete',
    'roles.assign_permissions',
    'permissions.create',
    'permissions.read',
    'permissions.update',
    'permissions.delete',
    'customers.create',
    'customers.read',
    'customers.update',
    'customers.delete',
  ];

  for (const code of permissionCodes) {
    const permission = await prisma.permission.upsert({
      where: {
        companyId_code: {
          companyId: company.id,
          code,
        },
      },
      update: {
        description: code,
        status: 'ACTIVE',
      },
      create: {
        companyId: company.id,
        code,
        description: code,
        status: 'ACTIVE',
      },
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: role.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('Permissões do Administrador atualizadas.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

