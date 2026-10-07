import { Module } from '@nestjs/common';

import { VehicleController } from './vehicle.controller';
import { VehicleService } from './vehicle.service';

import { PrismaModule } from '../prisma/prisma.module';
import { CaslModule } from '../casl/casl.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    PrismaModule,
    CaslModule,
    AuditModule,
  ],

  controllers: [VehicleController],

  providers: [VehicleService],

  exports: [VehicleService],
})
export class VehicleModule {}