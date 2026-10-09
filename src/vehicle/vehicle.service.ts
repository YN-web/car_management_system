
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

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

  // CREATE VEHICLE
  async create(
    createVehicleDto: CreateVehicleDto,
    userId: string,
  ) {
    if (createVehicleDto.driverId) {
      const driver = await this.prisma.user.findUnique({
        where: {
          id: createVehicleDto.driverId,
        },
        include: {
          role: true,
        },
      });

      if (!driver) {
        throw new NotFoundException('Driver not found');
      }

      if (!driver.isActive) {
        throw new ForbiddenException(
          'An inactive user cannot be assigned to a vehicle',
        );
      }

      if (driver.enterpriseId !== createVehicleDto.enterpriseId) {
        throw new ForbiddenException(
          'Driver and vehicle must belong to the same enterprise',
        );
      }

      if (driver.role.name !== 'Driver') {
        throw new ForbiddenException(
          'Only users with the Driver role can be assigned to a vehicle',
        );
      }

      const existingVehicle =
        await this.prisma.vehicle.findFirst({
          where: {
            driverId: createVehicleDto.driverId,
          },
        });

      if (existingVehicle) {
        throw new ConflictException(
          'This driver is already assigned to another vehicle',
        );
      }
    }

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

  // GET ALL VEHICLES WITH SEARCH, FILTERING, PAGINATION AND SORTING
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
    const safePage =
      Number.isInteger(Number(page)) && Number(page) > 0
        ? Number(page)
        : 1;

    const safeLimit =
      Number.isInteger(Number(limit)) && Number(limit) > 0
        ? Math.min(Number(limit), 100)
        : 10;

    const skip = (safePage - 1) * safeLimit;

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

    const safeSortOrder =
      sortOrder === 'asc' ? 'asc' : 'desc';

    const parsedYear = year ? Number(year) : undefined;

    const where = {
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
      ...(parsedYear && Number.isInteger(parsedYear)
        ? { year: parsedYear }
        : {}),
    };

    const [vehicles, total] = await this.prisma.$transaction([
      this.prisma.vehicle.findMany({
        where,
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
          [safeSortBy]: safeSortOrder,
        },
        skip,
        take: safeLimit,
      }),

      this.prisma.vehicle.count({
        where,
      }),
    ]);

    return {
      data: vehicles,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  // GET ONE VEHICLE
  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
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

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }

  // UPDATE VEHICLE
  async update(
    id: string,
    updateVehicleDto: UpdateVehicleDto,
    userId: string,
  ) {
    const existingVehicle =
      await this.prisma.vehicle.findUnique({
        where: { id },
      });

    if (!existingVehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const targetEnterpriseId =
      updateVehicleDto.enterpriseId ??
      existingVehicle.enterpriseId;

    // Validate a new driver assignment when driverId is supplied.
    if (
      updateVehicleDto.driverId !== undefined &&
      updateVehicleDto.driverId !== existingVehicle.driverId
    ) {
      if (updateVehicleDto.driverId) {
        const driver = await this.prisma.user.findUnique({
          where: {
            id: updateVehicleDto.driverId,
          },
          include: {
            role: true,
          },
        });

        if (!driver) {
          throw new NotFoundException('Driver not found');
        }

        if (!driver.isActive) {
          throw new ForbiddenException(
            'An inactive user cannot be assigned to a vehicle',
          );
        }

        if (driver.enterpriseId !== targetEnterpriseId) {
          throw new ForbiddenException(
            'Driver and vehicle must belong to the same enterprise',
          );
        }

        if (driver.role.name !== 'Driver') {
          throw new ForbiddenException(
            'Only users with the Driver role can be assigned to a vehicle',
          );
        }

        const existingAssignment =
          await this.prisma.vehicle.findFirst({
            where: {
              driverId: updateVehicleDto.driverId,
              id: {
                not: id,
              },
            },
          });

        if (existingAssignment) {
          throw new ConflictException(
            'This driver is already assigned to another vehicle',
          );
        }
      }
    }

    // If the vehicle's enterprise changes, its existing driver
    // must still belong to the target enterprise.
    if (
      updateVehicleDto.enterpriseId &&
      updateVehicleDto.enterpriseId !==
        existingVehicle.enterpriseId
    ) {
      const driverId =
        updateVehicleDto.driverId !== undefined
          ? updateVehicleDto.driverId
          : existingVehicle.driverId;

      if (driverId) {
        const driver = await this.prisma.user.findUnique({
          where: { id: driverId },
        });

        if (!driver) {
          throw new NotFoundException('Driver not found');
        }

        if (driver.enterpriseId !== targetEnterpriseId) {
          throw new ForbiddenException(
            'Driver and vehicle must belong to the same enterprise',
          );
        }
      }
    }

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

  // DELETE VEHICLE
  async remove(id: string, userId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.vehicle.delete({
        where: { id },
      });

      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          entity: 'Vehicle',
          entityId: vehicle.id,
          userId,
        },
      });
    });

    return {
      success: true,
      message: 'Vehicle deleted successfully',
      id: vehicle.id,
    };
  }

  // EXPORT VEHICLES TO CSV
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
      enterprise: vehicle.enterprise.name,
      driver: vehicle.driver?.name ?? '',
    }));

    const parser = new Parser();

    return parser.parse(data);
  }
}

