import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function requireAdminPassword(): string {
  const password = process.env.SEED_ADMIN_PASSWORD?.trim();

  if (!password) {
    throw new Error(
      'SEED_ADMIN_PASSWORD nao definido. Configure uma senha forte antes de executar o seed.',
    );
  }

  if (password.length < 12) {
    throw new Error('SEED_ADMIN_PASSWORD deve ter pelo menos 12 caracteres.');
  }

  return password;
}

async function main(): Promise<void> {
  const adminPassword = requireAdminPassword();
  const adminEmail =
    process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase() ??
    'admin@cerradusgelo.local';
  const adminName = process.env.SEED_ADMIN_NAME?.trim() || 'Administrador';

  const company = await prisma.company.upsert({
    where: {
      document: '00000000000100',
    },
    update: {
      legalName: "Cerradu's Gelo Ltda",
      tradeName: "Cerradu's Gelo",
      status: 'ACTIVE',
    },
    create: {
      legalName: "Cerradu's Gelo Ltda",
      tradeName: "Cerradu's Gelo",
      document: '00000000000100',
      email: 'contato@cerradusgelo.local',
      status: 'ACTIVE',
    },
  });

  const branch = await prisma.branch.upsert({
    where: {
      companyId_code: {
        companyId: company.id,
        code: 'MATRIZ',
      },
    },
    update: {
      name: 'Matriz',
      status: 'ACTIVE',
    },
    create: {
      companyId: company.id,
      name: 'Matriz',
      code: 'MATRIZ',
      status: 'ACTIVE',
    },
  });

  const role = await prisma.role.upsert({
    where: {
      companyId_name: {
        companyId: company.id,
        name: 'Administrador',
      },
    },
    update: {
      description: 'Acesso administrativo completo',
      status: 'ACTIVE',
    },
    create: {
      companyId: company.id,
      name: 'Administrador',
      description: 'Acesso administrativo completo',
      status: 'ACTIVE',
    },
  });

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const user = await prisma.user.upsert({
    where: {
      companyId_email: {
        companyId: company.id,
        email: adminEmail,
      },
    },
    update: {
      name: adminName,
      branchId: branch.id,
      passwordHash,
      status: 'ACTIVE',
    },
    create: {
      companyId: company.id,
      branchId: branch.id,
      name: adminName,
      email: adminEmail,
      passwordHash,
      status: 'ACTIVE',
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: role.id,
    },
  });

  console.log('Seed concluido.');
  console.log(`Usuario administrador: ${adminEmail}`);
  console.log('Senha nao exibida por seguranca.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
