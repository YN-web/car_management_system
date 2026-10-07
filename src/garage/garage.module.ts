import { Module } from '@nestjs/common';

import { GarageService } from './garage.service';
import { GarageController } from './garage.controller';
import { CaslModule } from '../casl/casl.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [CaslModule,  AuditModule,],
  controllers: [GarageController],
  providers: [GarageService],
  exports: [GarageService],
})
export class GarageModule {}