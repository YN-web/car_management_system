import {
  Injectable,
  NotFoundException,
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

    const category =
      await this.prisma.expenseCategory.findUnique({
        where: {
          id: dto.categoryId,
        },
      });

    if (!category) {
      throw new NotFoundException(
        'Expense category not found',
      );
    }

    const expense =
      await this.prisma.expense.create({
        data: {
          vehicleId: dto.vehicleId,
          categoryId: dto.categoryId,
          amount: dto.amount,
          description: dto.description,
        },
        include: {
          vehicle: true,
          category: true,
        },
      });

    await this.auditService.log(
      'CREATE',
      'Expense',
      expense.id,
      userId,
    );

    return expense;
  }

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
      vehicle:
        expense.vehicle.plateNumber,
      category:
        expense.category.name,
      amount: expense.amount,
      type: expense.billingId
        ? 'Automatic'
        : 'Manual',
      description:
        expense.description ?? '',
      invoiceRef:
        expense.billing?.invoiceRef ?? '',
    }));

    const parser = new Parser();

    return parser.parse(data);
  }
}