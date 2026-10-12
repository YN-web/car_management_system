import { Module } from '@nestjs/common';
import { ExpenseCategoryService } from './expense-category.service';
import { ExpenseCategoryController } from './expense-category.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CaslModule } from '../casl/casl.module';


@Module({
    imports: [PrismaModule, CaslModule],
  providers: [ExpenseCategoryService],
  controllers: [ExpenseCategoryController]
})
export class ExpenseCategoryModule {}
