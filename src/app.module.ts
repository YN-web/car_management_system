// src/app.module.ts
import { ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { GarageModule } from './garage/garage.module';
import { EnterpriseModule } from './enterprise/enterprise.module';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { PermissionModule } from './permission/permission.module';
import { CaslModule } from './casl/casl.module';
import { AuthModule } from './auth/auth.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { ContractModule } from './contract/contract.module';
import { RepairRequestModule } from './repair-request/repair-request.module';
import { BillingModule } from './billing/billing.module';
import { ExpenseModule } from './expense/expense.module';
import { ReportModule } from './report/report.module';
import { AuditModule } from './audit/audit.module';


@Module({
  imports: [
    ThrottlerModule.forRoot([
  {
    ttl: 60000,
    limit: 10,
  },
]),


  PrismaModule,
  GarageModule,
  EnterpriseModule,
  UserModule,
  RoleModule,
  PermissionModule,
  CaslModule,
  AuthModule,
  VehicleModule,
  ContractModule,
  RepairRequestModule,
  BillingModule,
  ExpenseModule,
  ReportModule,
  AuditModule,
],


  controllers: [AppController],
  providers: [
  AppService,
  {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  },
],
})
export class AppModule {}