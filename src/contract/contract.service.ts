
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

import {
  CreateContractDto,
  UpdateContractDto,
} from './dto/contract.dto';

@Injectable()
export class ContractService {
  constructor(
  private readonly prisma: PrismaService,
  private readonly auditService: AuditService,
) {}

    async create(dto: CreateContractDto, userId: string) {
      const startDate = new Date(dto.startDate);
    const endDate = dto.endDate
      ? new Date(dto.endDate)
      : null;

    const now = new Date();

    const isActive =
      startDate <= now &&
      (endDate === null || endDate >= now);

    if (isActive) {
      const existingActiveContract =
        await this.prisma.contract.findFirst({
          where: {
            enterpriseId: dto.enterpriseId,

            startDate: {
              lte: now,
            },

            OR: [
              {
                endDate: null,
              },
              {
                endDate: {
                  gte: now,
                },
              },
            ],
          },
        });

      if (existingActiveContract) {
        throw new ConflictException(
          'This enterprise already has an active contract',
        );
      }
    }

const contract = await this.prisma.contract.create({
  data: {
    garageId: dto.garageId,
    enterpriseId: dto.enterpriseId,
    startDate,
    endDate,
    terms: dto.terms,
    discountPercent: dto.discountPercent ?? 0,

    createdById: userId,
    updatedById: userId,
  },
});

await this.auditService.log(
  'CREATE',
  'Contract',
  contract.id,
  userId,
);

return contract;
  }

  async findAll(
    page = 1,
    limit = 10,
    sortBy = 'startDate',
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    page = Math.max(1, page);
    limit = Math.min(Math.max(1, limit), 100);

    const skip = (page - 1) * limit;

    const allowedSortFields = [
      'startDate',
      'endDate',
      'discountPercent',
      'createdAt',
    ];

    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'startDate';

    const [contracts, total] =
      await this.prisma.$transaction([
        this.prisma.contract.findMany({
          include: {
            garage: true,
            enterprise: true,
          },

          orderBy: {
            [safeSortBy]: sortOrder,
          },

          skip,
          take: limit,
        }),

        this.prisma.contract.count(),
      ]);

    return {
      data: contracts,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findExpiring(
    page = 1,
    limit = 10,
    sortBy = 'endDate',
    sortOrder: 'asc' | 'desc' = 'asc',
  ) {
    page = Math.max(1, page);
    limit = Math.min(Math.max(1, limit), 100);

    const now = new Date();

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    const skip = (page - 1) * limit;

    const allowedSortFields = [
      'endDate',
      'startDate',
      'discountPercent',
      'createdAt',
    ];

    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'endDate';

    const where = {
      endDate: {
        gte: now,
        lte: expiryDate,
      },
    };

    const [contracts, total] =
      await this.prisma.$transaction([
        this.prisma.contract.findMany({
          where,

          include: {
            garage: true,
            enterprise: true,
          },

          orderBy: {
            [safeSortBy]: sortOrder,
          },

          skip,
          take: limit,
        }),

        this.prisma.contract.count({
          where,
        }),
      ]);

    return {
      data: contracts,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const contract =
      await this.prisma.contract.findUnique({
        where: { id },

        include: {
          garage: true,
          enterprise: true,
        },
      });

    if (!contract) {
      throw new NotFoundException(
        `Contract with ID ${id} not found`,
      );
    }

    return contract;
  }

  async update(
    id: string,
    dto: UpdateContractDto,
    userId: string,

  ) {
    await this.findOne(id);

    const contract = await this.prisma.contract.update({
  where: { id },

  data: {
    ...(dto.garageId !== undefined && {
      garageId: dto.garageId,
    }),

    ...(dto.enterpriseId !== undefined && {
      enterpriseId: dto.enterpriseId,
    }),

    ...(dto.startDate !== undefined && {
      startDate: new Date(dto.startDate),
    }),

    ...(dto.endDate !== undefined && {
      endDate: dto.endDate
        ? new Date(dto.endDate)
        : null,
    }),

    ...(dto.terms !== undefined && {
      terms: dto.terms,
    }),

    ...(dto.discountPercent !== undefined && {
      discountPercent: dto.discountPercent,
    }),

    updatedById: userId,
  },
});

await this.auditService.log(
  'UPDATE',
  'Contract',
  contract.id,
  userId,
);

return contract;
  }
async remove(id: string, userId: string) {
  const contract = await this.findOne(id);

  await this.auditService.log(
    'DELETE',
    'Contract',
    contract.id,
    userId,
  );

  return this.prisma.contract.delete({
    where: { id },
  });
}
}

