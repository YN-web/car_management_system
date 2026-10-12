
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';

@Injectable()
export class ExpenseCategoryService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // Create a new permanent expense category
  async create(dto: CreateExpenseCategoryDto) {
    const name = dto.name.trim();

    if (!name) {
      throw new ConflictException(
        'Expense category name cannot be empty.',
      );
    }

    const existing =
      await this.prisma.expenseCategory.findUnique({
        where: { name },
      });

    if (existing) {
      throw new ConflictException(
        'This expense category already exists.',
      );
    }

    return this.prisma.expenseCategory.create({
      data: { name },
    });
  }

  // Get all permanent expense categories
  async findAll() {
    return this.prisma.expenseCategory.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  // Get one category by ID
  async findOne(id: string) {
    const category =
      await this.prisma.expenseCategory.findUnique({
        where: { id },
      });

    if (!category) {
      throw new NotFoundException(
        'Expense category not found.',
      );
    }

    return category;
  }
}
