import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
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

  const passwordHash = await bcrypt.hash('WiseERP@123', 12);

  const user = await prisma.user.upsert({
    where: {
      companyId_email: {
        companyId: company.id,
        email: 'admin@cerradusgelo.local',
      },
    },
    update: {
      name: 'Administrador',
      branchId: branch.id,
      passwordHash,
      status: 'ACTIVE',
    },
    create: {
      companyId: company.id,
      branchId: branch.id,
      name: 'Administrador',
      email: 'admin@cerradusgelo.local',
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

  console.log('Seed concluído.');
  console.log('Usuário: admin@cerradusgelo.local');
  console.log('Senha: WiseERP@123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });