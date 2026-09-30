import { Injectable, NotFoundException,   ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateContractDto,
  UpdateContractDto,
} from './dto/contract.dto';

@Injectable()
export class ContractService {
  constructor(private readonly prisma: PrismaService) {}

async create(dto: CreateContractDto) {
  const startDate = new Date(dto.startDate);
  const endDate = dto.endDate ? new Date(dto.endDate) : null;

  const now = new Date();

  const isActive =
    startDate <= now && (endDate === null || endDate >= now);

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

  return this.prisma.contract.create({
    data: {
      garageId: dto.garageId,
      enterpriseId: dto.enterpriseId,
      startDate,
      endDate,
      terms: dto.terms,
      discountPercent: dto.discountPercent ?? 0,
    },
  });
}

  async findAll() {
    return this.prisma.contract.findMany({
      include: {
        garage: true,
        enterprise: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });
  }

  async findExpiring(days: number = 30) {
  const now = new Date();

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);

  return this.prisma.contract.findMany({
    where: {
      endDate: {
        gte: now,
        lte: expiryDate,
      },
    },
    include: {
      garage: true,
      enterprise: true,
    },
    orderBy: {
      endDate: 'asc',
    },
  });
}

  async findOne(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        garage: true,
        enterprise: true,
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    return contract;
  }

  async update(id: string, dto: UpdateContractDto) {
    await this.findOne(id);

    return this.prisma.contract.update({
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
          endDate: dto.endDate ? new Date(dto.endDate) : null,
        }),
        ...(dto.terms !== undefined && {
          terms: dto.terms,
        }),
        ...(dto.discountPercent !== undefined && {
          discountPercent: dto.discountPercent,
        }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.contract.delete({
      where: { id },
    });
  }
}