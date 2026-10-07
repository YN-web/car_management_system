import { Module } from '@nestjs/common';

import { EnterpriseController } from './enterprise.controller';
import { EnterpriseService } from './enterprise.service';

import { PrismaModule } from '../prisma/prisma.module';
import { CaslModule } from '../casl/casl.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    PrismaModule,
    CaslModule,
    AuditModule,
  ],
  controllers: [EnterpriseController],
  providers: [EnterpriseService],
  exports: [EnterpriseService],
})
export class EnterpriseModule {}