import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  Res,
} from '@nestjs/common';

import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { AbilityGuard } from '../casl/ability/ability.guard';
import { CheckAbility } from '../casl/ability/ability.decorator';

import type { Response } from 'express';

@Controller('expense')
@UseGuards(JwtAuthGuard, AbilityGuard)
export class ExpenseController {
  constructor(
    private readonly expenseService: ExpenseService,
  ) {}

  @Post()
  @CheckAbility('create', 'Expense')
  create(
    @Body() dto: CreateExpenseDto,
    @Req() req: any,
  ) {
    return this.expenseService.create(
      dto,
      req.user.id,
    );
  }

  @Get()
  @CheckAbility('read', 'Expense')
  findAll() {
    return this.expenseService.findAll();
  }

  @Get(':id')
  @CheckAbility('read', 'Expense')
  findOne(@Param('id') id: string) {
    return this.expenseService.findOne(id);
  }

  @Get('export/csv')
  @CheckAbility('read', 'Expense')
  async exportCsv(@Res() res: Response) {
    const csv =
      await this.expenseService.exportCsv();

    res.header('Content-Type', 'text/csv');
    res.attachment('expenses.csv');
    res.send(csv);
  }
}