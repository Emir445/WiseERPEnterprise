import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validateEnvironment } from './config/environment';
import { AuthModule } from './core/auth/auth.module';
import { DatabaseModule } from './core/database/database.module';
import { RequestContextMiddleware } from './core/http/request-context.middleware';
import { HealthModule } from './health/health.module';
import { AuditModule } from './modules/audit/audit.module';
import { BranchesModule } from './modules/branches/branches.module';
import { CarriersModule } from './modules/carriers/carriers.module';
import { ChartAccountsModule } from './modules/chart-accounts/chart-accounts.module';
import { CostCentersModule } from './modules/cost-centers/cost-centers.module';
import { CrmModule } from './modules/crm/crm.module';
import { CustomersModule } from './modules/customers/customers.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { FinanceModule } from './modules/finance/finance.module';
import { FiscalModule } from './modules/fiscal/fiscal.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { LogisticsModule } from './modules/logistics/logistics.module';
import { PaymentTermsModule } from './modules/payment-terms/payment-terms.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { ProcurementModule } from './modules/procurement/procurement.module';
import { ProductCategoriesModule } from './modules/product-categories/product-categories.module';
import { ProductionModule } from './modules/production/production.module';
import { ProductsModule } from './modules/products/products.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { ReportsModule } from './modules/reports/reports.module';
import { RolesModule } from './modules/roles/roles.module';
import { SalesOrdersModule } from './modules/sales-orders/sales-orders.module';
import { SalesModule } from './modules/sales/sales.module';
import { ServicesModule } from './modules/services/services.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { TreasuryModule } from './modules/treasury/treasury.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      validate: validateEnvironment,
    }),
    DatabaseModule,
    AuditModule,
    CrmModule,
    ServicesModule,
    AuthModule,
    HealthModule,
    BranchesModule,
    CarriersModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    PaymentTermsModule,
    CustomersModule,
    DashboardModule,
    SuppliersModule,
    ProductCategoriesModule,
    ProductsModule,
    ProcurementModule,
    ProductionModule,
    InventoryModule,
    LogisticsModule,
    PurchasesModule,
    QuotesModule,
    SalesOrdersModule,
    SalesModule,
    FinanceModule,
    ChartAccountsModule,
    CostCentersModule,
    TreasuryModule,
    FiscalModule,
    ReportsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
