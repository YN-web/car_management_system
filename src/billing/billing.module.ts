import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CaslModule } from '../casl/casl.module';
import { AuditModule } from '../audit/audit.module';


@Module({
  imports: [PrismaModule, CaslModule, AuditModule,],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}