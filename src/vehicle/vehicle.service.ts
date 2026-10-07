import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Parser } from 'json2csv';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class VehicleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    createVehicleDto: CreateVehicleDto,
    userId: string,
  ) {
    const vehicle = await this.prisma.vehicle.create({
      data: {
        plateNumber: createVehicleDto.plateNumber,
        brand: createVehicleDto.brand,
        model: createVehicleDto.model,
        year: createVehicleDto.year,
        status: createVehicleDto.status,
        driverId: createVehicleDto.driverId,
        enterpriseId: createVehicleDto.enterpriseId,
      },
    });

    await this.auditService.log(
      'CREATE',
      'Vehicle',
      vehicle.id,
      userId,
    );

    return vehicle;
  }

  async findAll(
    search?: string,
    status?: string,
    brand?: string,
    model?: string,
    year?: string,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    const skip = (page - 1) * limit;

    const allowedSortFields = [
      'createdAt',
      'plateNumber',
      'brand',
      'model',
      'year',
      'status',
    ];

    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const [vehicles, total] = await this.prisma.$transaction([
      this.prisma.vehicle.findMany({
        where: {
          ...(search
            ? {
                OR: [
                  { plateNumber: { contains: search } },
                  { brand: { contains: search } },
                  { model: { contains: search } },
                ],
              }
            : {}),
          ...(status ? { status } : {}),
          ...(brand ? { brand: { contains: brand } } : {}),
          ...(model ? { model: { contains: model } } : {}),
          ...(year ? { year: Number(year) } : {}),
        },

        include: {
          driver: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },

        orderBy: {
          [safeSortBy]: sortOrder,
        },

        skip,
        take: limit,
      }),

      this.prisma.vehicle.count({
        where: {
          ...(search
            ? {
                OR: [
                  { plateNumber: { contains: search } },
                  { brand: { contains: search } },
                  { model: { contains: search } },
                ],
              }
            : {}),
          ...(status ? { status } : {}),
          ...(brand ? { brand: { contains: brand } } : {}),
          ...(model ? { model: { contains: model } } : {}),
          ...(year ? { year: Number(year) } : {}),
        },
      }),
    ]);

    return {
      data: vehicles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  findOne(id: string) {
    return this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        repairRequests: true,
        expenses: true,
      },
    });
  }

  async update(
    id: string,
    updateVehicleDto: UpdateVehicleDto,
    userId: string,
  ) {
    const vehicle = await this.prisma.vehicle.update({
      where: { id },
      data: updateVehicleDto,
    });

    await this.auditService.log(
      'UPDATE',
      'Vehicle',
      vehicle.id,
      userId,
    );

    return vehicle;
  }

  async remove(id: string, userId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    await this.auditService.log(
      'DELETE',
      'Vehicle',
      vehicle.id,
      userId,
    );

    return this.prisma.vehicle.delete({
      where: { id },
    });
  }

  async exportCsv() {
    const vehicles = await this.prisma.vehicle.findMany({
      include: {
        enterprise: true,
        driver: true,
      },
    });

    const data = vehicles.map((vehicle) => ({
      plateNumber: vehicle.plateNumber,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      status: vehicle.status,
      enterprise: vehicle.enterprise?.name ?? '',
      driver: vehicle.driver?.name ?? '',
    }));

    const parser = new Parser();
    return parser.parse(data);
  }
}