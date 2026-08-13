import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function requireSeedValue(name: string, minLength = 1): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} nao definido.`);
  }

  if (value.length < minLength) {
    throw new Error(`${name} deve ter pelo menos ${minLength} caracteres.`);
  }

  return value;
}

async function main(): Promise<void> {
  const companyLegalName = requireSeedValue('SEED_COMPANY_LEGAL_NAME');
  const companyTradeName = requireSeedValue('SEED_COMPANY_TRADE_NAME');
  const companyDocument = requireSeedValue('SEED_COMPANY_DOCUMENT');
  const companyEmail = requireSeedValue('SEED_COMPANY_EMAIL').toLowerCase();

  const branchCode =
    process.env.SEED_BRANCH_CODE?.trim().toUpperCase() || 'MATRIZ';
  const branchName = process.env.SEED_BRANCH_NAME?.trim() || 'Matriz';

  const adminEmail = requireSeedValue('SEED_ADMIN_EMAIL').toLowerCase();
  const adminName = process.env.SEED_ADMIN_NAME?.trim() || 'Administrador';
  const adminPassword = requireSeedValue('SEED_ADMIN_PASSWORD', 12);

  const company = await prisma.company.upsert({
    where: {
      document: companyDocument,
    },
    update: {
      legalName: companyLegalName,
      tradeName: companyTradeName,
      email: companyEmail,
      status: 'ACTIVE',
    },
    create: {
      legalName: companyLegalName,
      tradeName: companyTradeName,
      document: companyDocument,
      email: companyEmail,
      status: 'ACTIVE',
    },
  });

  const branch = await prisma.branch.upsert({
    where: {
      companyId_code: {
        companyId: company.id,
        code: branchCode,
      },
    },
    update: {
      name: branchName,
      status: 'ACTIVE',
    },
    create: {
      companyId: company.id,
      name: branchName,
      code: branchCode,
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

  console.log('Seed de piloto concluido.');
  console.log(`Empresa: ${companyTradeName}`);
  console.log(`Filial: ${branchName}`);
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
