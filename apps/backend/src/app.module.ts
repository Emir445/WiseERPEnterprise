import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './core/auth/auth.module';
import { DatabaseModule } from './core/database/database.module';
import { HealthModule } from './health/health.module';
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
    UsersModule,
  ],
})
export class AppModule {}
