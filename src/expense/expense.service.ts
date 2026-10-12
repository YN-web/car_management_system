import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { Parser } from 'json2csv';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ExpenseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    dto: CreateExpenseDto,
    userId: string,
  ) {
    // Check that the vehicle exists
    const vehicle =
      await this.prisma.vehicle.findUnique({
        where: {
          id: dto.vehicleId,
        },
      });

    if (!vehicle) {
      throw new NotFoundException(
        'Vehicle not found',
      );
    }

    // Determine the category to use
    let categoryId = dto.categoryId;

    if (!categoryId && dto.categoryName?.trim()) {
      const otherCategory =
        await this.prisma.expenseCategory.findUnique({
          where: {
            name: 'Other',
          },
          select: {
            id: true,
          },
        });

      if (!otherCategory) {
        throw new NotFoundException(
          'The Other expense category must exist.',
        );
      }

      categoryId = otherCategory.id;
    }

    if (!categoryId) {
      throw new BadRequestException(
        'Select an existing category or enter a custom category name.',
      );
    }

    // Check that the selected category exists
    const category =
      await this.prisma.expenseCategory.findUnique({
        where: {
          id: categoryId,
        },
      });

    if (!category) {
      throw new NotFoundException(
        'Expense category not found',
      );
    }

    // Create the expense
    const expense =
      await this.prisma.expense.create({
        data: {
          vehicleId: dto.vehicleId,
          categoryId: categoryId,
          customCategory:
            dto.categoryName?.trim() || null,
          amount: dto.amount,
          description: dto.description,
        },
        include: {
          vehicle: true,
          category: true,
          billing: true,
        },
      });

    // Record the action in the audit log
    await this.auditService.log(
      'CREATE',
      'Expense',
      expense.id,
      userId,
    );

    return expense;
  }

  // Get all expenses
  findAll() {
    return this.prisma.expense.findMany({
      include: {
        vehicle: true,
        category: true,
        billing: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  // Get one expense
  async findOne(id: string) {
    const expense =
      await this.prisma.expense.findUnique({
        where: {
          id,
        },
        include: {
          vehicle: true,
          category: true,
          billing: true,
        },
      });

    if (!expense) {
      throw new NotFoundException(
        'Expense not found',
      );
    }

    return expense;
  }

  // Export expenses to CSV
  async exportCsv() {
    const expenses =
      await this.prisma.expense.findMany({
        include: {
          vehicle: true,
          category: true,
          billing: true,
        },
        orderBy: {
          date: 'desc',
        },
      });

    const data = expenses.map((expense) => ({
      date: expense.date,
      vehicle: expense.vehicle.plateNumber,
      category:
        expense.customCategory ||
        expense.category.name,
      amount: expense.amount,
      type: expense.billingId
        ? 'Automatic'
        : 'Manual',
      description: expense.description ?? '',
      invoiceRef:
        expense.billing?.invoiceRef ?? '',
    }));

    const parser = new Parser();

    return parser.parse(data);
  }
}
