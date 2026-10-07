import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    data: {
      repairRequestId: string;
      serviceType: string;
      grossAmount: number;
      invoiceRef: string;
    },
    userId: string,
  ) {
    if (
      !Number.isFinite(data.grossAmount) ||
      data.grossAmount <= 0
    ) {
      throw new BadRequestException(
        'Gross amount must be greater than zero',
      );
    }

    const request =
      await this.prisma.repairRequest.findUnique({
        where: { id: data.repairRequestId },
        include: {
          billing: true,
          vehicle: true,
        },
      });

    if (!request) {
      throw new NotFoundException(
        'Repair request not found',
      );
    }

    if (request.status !== 'completed') {
      throw new BadRequestException(
        'Only completed repairs can be billed',
      );
    }

    if (request.billing) {
      throw new ConflictException(
        'This repair request has already been billed',
      );
    }

    const enterpriseId = request.vehicle.driverId
      ? (
          await this.prisma.user.findUnique({
            where: {
              id: request.vehicle.driverId,
            },
            select: {
              enterpriseId: true,
            },
          })
        )?.enterpriseId
      : undefined;

    const contract =
      await this.prisma.contract.findFirst({
        where: {
          garageId: request.garageId,
          enterpriseId: enterpriseId ?? undefined,
          startDate: {
            lte: new Date(),
          },
          OR: [
            {
              endDate: null,
            },
            {
              endDate: {
                gte: new Date(),
              },
            },
          ],
        },
        orderBy: {
          startDate: 'desc',
        },
      });

    const discountPercent =
      contract?.discountPercent ?? 0;

    if (
      discountPercent < 0 ||
      discountPercent > 100
    ) {
      throw new BadRequestException(
        'Contract discount must be between 0 and 100 percent',
      );
    }

    const discountAmount =
      data.grossAmount *
      (discountPercent / 100);

    const netAmount =
      data.grossAmount -
      discountAmount;

    // Garage expense category
    const categoryId =
      '3042792a-e240-4917-b92e-569c082327c2';

    return this.prisma.$transaction(
      async (tx) => {
        // 1. Create billing
        const billing =
          await tx.billing.create({
            data: {
              repairRequestId:
                data.repairRequestId,
              serviceType:
                data.serviceType,
              grossAmount:
                data.grossAmount,
              discountAmount,
              netAmount,
              invoiceRef:
                data.invoiceRef,
            },
            include: {
              repairRequest: true,
            },
          });

        // 2. Automatically create expense
        await tx.expense.create({
          data: {
            vehicleId:
              request.vehicleId,
            categoryId,
            billingId:
              billing.id,
            amount:
              netAmount,
            description:
              `Repair billing - ${data.serviceType}`,
          },
        });

        // 3. Audit billing creation
        await this.auditService.log(
          'CREATE',
          'Billing',
          billing.id,
          userId,
        );

        return billing;
      },
    );
  }

  findAll() {
    return this.prisma.billing.findMany({
      include: {
        repairRequest: {
          include: {
            vehicle: true,
            garage: true,
          },
        },
        expense: true,
      },
      orderBy: {
        billedDate: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const billing =
      await this.prisma.billing.findUnique({
        where: { id },
        include: {
          repairRequest: {
            include: {
              vehicle: true,
              garage: true,
            },
          },
          expense: true,
        },
      });

    if (!billing) {
      throw new NotFoundException(
        'Billing record not found',
      );
    }

    return billing;
  }
}