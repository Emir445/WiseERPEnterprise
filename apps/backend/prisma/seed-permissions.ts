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
    'suppliers.create',
    'suppliers.read',
    'suppliers.update',
    'suppliers.delete',
    'products.create',
    'products.read',
    'products.update',
    'products.delete',
    'inventory.read',
    'inventory.entry',
    'inventory.exit',
    'inventory.adjustment',
    'purchases.create',
    'purchases.read',
    'purchases.update',
    'purchases.confirm',
    'purchases.cancel',
    'sales.create',
    'sales.read',
    'sales.update',
    'sales.confirm',
    'sales.cancel',
    'finance.read',
    'finance.settle',
    'finance.cancel',
    'dashboard.read',
    'reports.read',
    'inventory.transfer',
    'product_categories.delete',
    'product_categories.update',
    'product_categories.read',
    'product_categories.create',
    'branches.delete',
    'branches.update',
    'branches.read',
    'branches.create',
    'payment_terms.create',
    'payment_terms.read',
    'payment_terms.update',
    'payment_terms.delete',
    'quotes.create',
    'quotes.read',
    'quotes.update',
    'quotes.approve',
    'quotes.convert',
    'sales_orders.create',
    'sales_orders.read',
    'sales_orders.confirm',
    'sales_orders.cancel',
    'sales_orders.convert',
    'fiscal.create',
    'fiscal.read',
    'fiscal.authorize',
    'fiscal.cancel',
    'finance.create',
    'chart_accounts.create',
    'chart_accounts.read',
    'chart_accounts.update',
    'chart_accounts.delete',
    'cost_centers.create',
    'cost_centers.read',
    'cost_centers.update',
    'cost_centers.delete',
    'treasury.accounts.create',
    'treasury.accounts.read',
    'treasury.accounts.update',
    'treasury.accounts.delete',
    'treasury.read',
    'treasury.adjust',
    'treasury.transfer',
    'treasury.reconcile',
    'treasury.cash.open',
    'treasury.cash.close',
    'treasury.cash.read',
    'procurement.requests.create',
    'procurement.requests.read',
    'procurement.requests.approve',
    'procurement.orders.create',
    'procurement.orders.read',
    'procurement.orders.confirm',
    'procurement.receipts.create',
    'sales_orders.reserve',
    'carriers.create',
    'carriers.read',
    'carriers.update',
    'carriers.delete',
    'logistics.shipments.create',
    'logistics.shipments.read',
    'logistics.shipments.pick',
    'logistics.shipments.ship',
    'logistics.shipments.deliver',
    'logistics.shipments.cancel',
    'logistics.returns.create',
    'logistics.returns.read',
    'logistics.returns.receive',
    'logistics.returns.cancel',
    'production.bom.create',
    'production.bom.read',
    'production.orders.create',
    'production.orders.read',
    'production.orders.start',
    'production.orders.complete',
    'production.orders.cancel',
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






