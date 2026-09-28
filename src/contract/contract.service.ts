import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateContractDto,
  UpdateContractDto,
} from './dto/contract.dto';

@Injectable()
export class ContractService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContractDto) {
    return this.prisma.contract.create({
      data: {
        garageId: dto.garageId,
        enterpriseId: dto.enterpriseId,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
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