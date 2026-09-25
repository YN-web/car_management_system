// src/app.module.ts
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

@Module({
  imports: [PrismaModule, GarageModule, 
    EnterpriseModule, UserModule, RoleModule, 
    PermissionModule, CaslModule, CaslModule, AuthModule, VehicleModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}