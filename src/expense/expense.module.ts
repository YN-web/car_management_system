import { Module } from '@nestjs/common';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './expense.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CaslModule } from '../casl/casl.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, CaslModule, AuditModule ],
  controllers: [ExpenseController],
  providers: [ExpenseService],
})
export class ExpenseModule {}