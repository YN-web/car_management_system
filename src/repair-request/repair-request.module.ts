import { Module } from '@nestjs/common';
import { RepairRequestController } from './repair-request.controller';
import { RepairRequestService } from './repair-request.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CaslModule } from '../casl/casl.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, CaslModule, AuditModule ],
  controllers: [RepairRequestController],
  providers: [RepairRequestService],
  exports: [RepairRequestService],
})
export class RepairRequestModule {}