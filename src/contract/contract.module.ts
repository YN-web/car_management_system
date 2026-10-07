import { Module } from '@nestjs/common';
import { ContractController } from './contract.controller';
import { ContractService } from './contract.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CaslModule } from '../casl/casl.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, CaslModule,  AuditModule,],
  controllers: [ContractController],
  providers: [ContractService],
  exports: [ContractService],

})
export class ContractModule {}