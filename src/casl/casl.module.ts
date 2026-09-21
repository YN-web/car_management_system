import { Module } from '@nestjs/common';
import { AbilityFactory } from './ability.factory';
import { AbilityGuard } from './ability/ability.guard';

@Module({
  providers: [AbilityFactory, AbilityGuard],
  exports: [AbilityFactory, AbilityGuard],
})
export class CaslModule {}