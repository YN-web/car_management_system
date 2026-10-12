
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';

import { ExpenseCategoryService } from './expense-category.service';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';

import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { AbilityGuard } from '../casl/ability/ability.guard';
import { CheckAbility } from '../casl/ability/ability.decorator';

@Controller('expense-category')
@UseGuards(JwtAuthGuard, AbilityGuard)
export class ExpenseCategoryController {
  constructor(
    private readonly expenseCategoryService: ExpenseCategoryService,
  ) {}

  @Post()
  @CheckAbility('create', 'ExpenseCategory')
  create(@Body() dto: CreateExpenseCategoryDto) {
    return this.expenseCategoryService.create(dto);
  }

  @Get()
  @CheckAbility('read', 'ExpenseCategory')
  findAll() {
    return this.expenseCategoryService.findAll();
  }

  @Get(':id')
  @CheckAbility('read', 'ExpenseCategory')
  findOne(@Param('id') id: string) {
    return this.expenseCategoryService.findOne(id);
  }
}
