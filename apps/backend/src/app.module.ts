import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './core/auth/auth.module';
import { BranchesModule } from './modules/branches/branches.module';
import { DatabaseModule } from './core/database/database.module';
import { HealthModule } from './health/health.module';
import { CustomersModule } from './modules/customers/customers.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { FinanceModule } from './modules/finance/finance.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { ProductCategoriesModule } from './modules/product-categories/product-categories.module';
import { ProductsModule } from './modules/products/products.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { ReportsModule } from './modules/reports/reports.module';
import { RolesModule } from './modules/roles/roles.module';
import { SalesModule } from './modules/sales/sales.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),
    DatabaseModule,
    AuthModule,
    HealthModule,
    BranchesModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    CustomersModule,
    DashboardModule,
    SuppliersModule,
    ProductCategoriesModule,
    ProductsModule,
    InventoryModule,
    PurchasesModule,
    SalesModule,
    FinanceModule,
    ReportsModule,
  ],
})
export class AppModule {}
