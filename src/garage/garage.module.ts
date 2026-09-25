import { Module } from '@nestjs/common';

import { GarageService } from './garage.service';
import { GarageController } from './garage.controller';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [CaslModule],
  controllers: [GarageController],
  providers: [GarageService],
  exports: [GarageService],
})
export class GarageModule {}