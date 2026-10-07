import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Parser } from 'json2csv';
import { Enterprise } from '../enterprise/entities/enterprise.entity';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  private getDateRange(from?: string, to?: string) {
    const now = new Date();

    const start = from
      ? new Date(from)
      : new Date(now.getFullYear(), 0, 1);

    const end = to
      ? new Date(to)
      : now;

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      throw new BadRequestException('Invalid date range');
    }

    if (start > end) {
      throw new BadRequestException(
        'from date cannot be after to date',
      );
    }

    end.setHours(23, 59, 59, 999);

    return {
      gte: start,
      lte: end,
    };
  }

  async getVehicleReport(
    vehicleId: string,
    enterpriseId: string,
    from?: string,
    to?: string,
  ) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        enterpriseId,
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const dateRange = this.getDateRange(from, to);

    const expenses = await this.prisma.expense.findMany({
      where: {
        vehicleId,
        date: dateRange,
      },
      include: {
        category: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    const totalSpend = expenses.reduce(
      (total, expense) =>
        total + Number(expense.amount),
      0,
    );

    const categoryTotals: Record<string, number> = {};

    for (const expense of expenses) {
      const category = expense.category.name;

      categoryTotals[category] =
        (categoryTotals[category] ?? 0) +
        Number(expense.amount);
    }

    const spendByCategory = Object.entries(
      categoryTotals,
    ).map(([category, amount]) => ({
      category,
      amount,
    }));

    const monthlyTotals: Record<string, number> = {};

    for (const expense of expenses) {
      const month = expense.date
        .toISOString()
        .slice(0, 7);

      monthlyTotals[month] =
        (monthlyTotals[month] ?? 0) +
        Number(expense.amount);
    }

    const monthlyTrend = Object.entries(
      monthlyTotals,
    )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({
        month,
        amount,
      }));

    return {
      vehicle,
      dateRange,
      summary: {
        totalSpend,
      },
      spendByCategory,
      monthlyTrend,
      expenses,
    };
  }

  async getEnterpriseReport(
    enterpriseId: string,
    loggedInEnterpriseId: string,
    from?: string,
    to?: string,
  ) {
    if (enterpriseId !== loggedInEnterpriseId) {
      throw new NotFoundException(
        'Enterprise not found',
      );
    }

    const enterprise =
      await this.prisma.enterprise.findUnique({
        where: {
          id: enterpriseId,
        },
      });

    if (!enterprise) {
      throw new NotFoundException(
        'Enterprise not found',
      );
    }

    const dateRange = this.getDateRange(from, to);

    const expenses =
      await this.prisma.expense.findMany({
        where: {
          date: dateRange,
          vehicle: {
            enterpriseId,
          },
        },
        include: {
          vehicle: true,
          category: true,
        },
        orderBy: {
          date: 'desc',
        },
      });

    const totalFleetSpend = expenses.reduce(
      (total, expense) =>
        total + Number(expense.amount),
      0,
    );

    const vehicleTotals: Record<string, number> = {};

    for (const expense of expenses) {
      const vehicleId = expense.vehicleId;

      vehicleTotals[vehicleId] =
        (vehicleTotals[vehicleId] ?? 0) +
        Number(expense.amount);
    }

    const topVehicles = Object.entries(
      vehicleTotals,
    )
      .map(([vehicleId, totalSpend]) => {
        const vehicle = expenses.find(
          (expense) =>
            expense.vehicleId === vehicleId,
        )?.vehicle;

        return {
          vehicleId,
          plateNumber:
            vehicle?.plateNumber ?? '',
          totalSpend,
        };
      })
      .sort(
        (a, b) =>
          b.totalSpend - a.totalSpend,
      )
      .slice(0, 10);

    const categoryTotals: Record<string, number> = {};

    for (const expense of expenses) {
      const category = expense.category.name;

      categoryTotals[category] =
        (categoryTotals[category] ?? 0) +
        Number(expense.amount);
    }

    const spendByCategory = Object.entries(
      categoryTotals,
    )
      .map(([category, amount]) => ({
        category,
        amount,
      }))
      .sort(
        (a, b) => b.amount - a.amount,
      );

    return {
      enterprise,
      dateRange,
      summary: {
        totalFleetSpend,
      },
      topVehicles,
      spendByCategory,
      expenses,
    };
  }

  async getDashboardReport(
    enterpriseId: string,
    loggedInEnterpriseId: string,
    from?: string,
    to?: string,
  ) {
    if (enterpriseId !== loggedInEnterpriseId) {
      throw new NotFoundException(
        'Enterprise not found',
      );
    }

    const enterprise =
      await this.prisma.enterprise.findUnique({
        where: {
          id: enterpriseId,
        },
      });

    if (!enterprise) {
      throw new NotFoundException(
        'Enterprise not found',
      );
    }

    const dateRange = this.getDateRange(from, to);

    const [
      vehicles,
      pendingRepairs,
      completedRepairs,
      rejectedRepairs,
      totalContracts,
      expiringContracts,
      expenses,
      recentExpenses,
      recentRepairs,
    ] = await Promise.all([
      this.prisma.vehicle.findMany({
        where: {
          enterpriseId,
        },
        select: {
          id: true,
          plateNumber: true,
          brand: true,
          model: true,
          year: true,
          status: true,
        },
      }),

      this.prisma.repairRequest.count({
        where: {
          vehicle: {
            enterpriseId,
          },
          status: 'pending_approval',
        },
      }),

      this.prisma.repairRequest.count({
        where: {
          vehicle: {
            enterpriseId,
          },
          status: 'completed',
        },
      }),

      this.prisma.repairRequest.count({
        where: {
          vehicle: {
            enterpriseId,
          },
          status: 'rejected',
        },
      }),

      this.prisma.contract.count({
        where: {
          enterpriseId,
        },
      }),

      this.prisma.contract.findMany({
        where: {
          enterpriseId,
          endDate: {
            not: null,
            gte: new Date(),
            lte: new Date(
              Date.now() +
                30 * 24 * 60 * 60 * 1000,
            ),
          },
        },
        include: {
          garage: true,
        },
        orderBy: {
          endDate: 'asc',
        },
      }),

      this.prisma.expense.findMany({
        where: {
          date: dateRange,
          vehicle: {
            enterpriseId,
          },
        },
        include: {
          category: true,
          vehicle: true,
        },
        orderBy: {
          date: 'desc',
        },
      }),

      this.prisma.expense.findMany({
        where: {
          date: dateRange,
          vehicle: {
            enterpriseId,
          },
        },
        include: {
          category: true,
          vehicle: true,
        },
        orderBy: {
          date: 'desc',
        },
        take: 5,
      }),

      this.prisma.repairRequest.findMany({
        where: {
          vehicle: {
            enterpriseId,
          },
        },
        include: {
          vehicle: true,
          garage: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),
    ]);

    const totalExpenses = expenses.reduce(
      (total, expense) =>
        total + Number(expense.amount),
      0,
    );

    const activeVehicles = vehicles.filter(
      (vehicle) =>
        vehicle.status === 'active',
    ).length;

    const inRepairVehicles = vehicles.filter(
  (vehicle) =>
    vehicle.status === 'in_repair',
).length;

const retiredVehicles = vehicles.filter(
  (vehicle) =>
    vehicle.status === 'retired',
).length;

    const manualExpenses = expenses
      .filter(
        (expense) =>
          expense.billingId === null,
      )
      .reduce(
        (total, expense) =>
          total + Number(expense.amount),
        0,
      );

    const automaticExpenses = expenses
      .filter(
        (expense) =>
          expense.billingId !== null,
      )
      .reduce(
        (total, expense) =>
          total + Number(expense.amount),
        0,
      );

    const monthlyExpenses: Record<
      string,
      number
    > = {};

    for (const expense of expenses) {
      const month = expense.date
        .toISOString()
        .slice(0, 7);

      monthlyExpenses[month] =
        (monthlyExpenses[month] ?? 0) +
        Number(expense.amount);
    }

    const monthlyTrend = Object.keys(
      monthlyExpenses,
    )
      .sort()
      .map((month) => ({
        month,
        expenses:
          monthlyExpenses[month],
      }));

    return {
      enterprise,

      dateRange,

      summary: {
        totalVehicles:
          vehicles.length,
        activeVehicles,
        inRepairVehicles,
retiredVehicles,
        totalExpenses,
        manualExpenses,
        automaticExpenses,
        pendingRepairs,
        completedRepairs,
        rejectedRepairs,
        totalContracts,
        expiringContracts:
          expiringContracts.length,
      },

    vehicleStatus: {
  active: activeVehicles,
  in_repair: inRepairVehicles,
  retired: retiredVehicles,
},

      repairStatus: {
        pending: pendingRepairs,
        completed: completedRepairs,
        rejected: rejectedRepairs,
      },

      monthlyTrend,

      vehicles,

      recentExpenses,

      recentRepairs,

      expiringContracts,
    };
  }

  async exportVehicleCsv(
    vehicleId: string,
    enterpriseId: string,
    from?: string,
    to?: string,
  ) {
    const report =
      await this.getVehicleReport(
        vehicleId,
        enterpriseId,
        from,
        to,
      );

    const data = [
      {
        section: 'Summary',
        vehicle:
          report.vehicle.plateNumber,
        category: '',
        month: '',
        amount:
          report.summary.totalSpend,
      },

      ...report.spendByCategory.map(
        (item) => ({
          section: 'Category',
          vehicle:
            report.vehicle.plateNumber,
          category: item.category,
          month: '',
          amount: item.amount,
        }),
      ),

      ...report.monthlyTrend.map(
        (item) => ({
          section: 'Monthly Trend',
          vehicle:
            report.vehicle.plateNumber,
          category: '',
          month: item.month,
          amount: item.amount,
        }),
      ),
    ];

    const parser = new Parser();

    return parser.parse(data);
  }

  async exportEnterpriseCsv(
    enterpriseId: string,
    loggedInEnterpriseId: string,
    from?: string,
    to?: string,
  ) {
    const report =
      await this.getEnterpriseReport(
        enterpriseId,
        loggedInEnterpriseId,
        from,
        to,
      );

    const data = [
      {
        section: 'Summary',
        enterprise:
          report.enterprise.name,
        vehicle: '',
        category: '',
        amount:
          report.summary.totalFleetSpend,
      },

      ...report.topVehicles.map(
        (vehicle) => ({
          section: 'Top Vehicle',
          enterprise:
            report.enterprise.name,
          vehicle:
            vehicle.plateNumber,
          category: '',
          amount:
            vehicle.totalSpend,
        }),
      ),

      ...report.spendByCategory.map(
        (item) => ({
          section: 'Category',
          enterprise:
            report.enterprise.name,
          vehicle: '',
          category: item.category,
          amount: item.amount,
        }),
      ),
    ];

    const parser = new Parser();

    return parser.parse(data);
  }
}
