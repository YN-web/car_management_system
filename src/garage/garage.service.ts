import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGarageDto, UpdateGarageDto } from './dto/garage.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class GarageService {
  constructor(
    private prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateGarageDto, userId: string) {
    const garage = await this.prisma.garage.create({
      data: dto,
    });

    await this.auditService.log(
      'CREATE',
      'Garage',
      garage.id,
      userId,
    );

    return garage;
  }

  async findAll() {
    return this.prisma.garage.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const garage = await this.prisma.garage.findUnique({
      where: { id },
    });

    if (!garage) {
      throw new NotFoundException(
        `Garage with ID ${id} not found`,
      );
    }

    return garage;
  }

  async update(
    id: string,
    dto: UpdateGarageDto,
    userId: string,
  ) {
    await this.findOne(id);

    const garage = await this.prisma.garage.update({
      where: { id },
      data: dto,
    });

    await this.auditService.log(
      'UPDATE',
      'Garage',
      garage.id,
      userId,
    );

    return garage;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id);

    await this.auditService.log(
      'DELETE',
      'Garage',
      id,
      userId,
    );

    return this.prisma.garage.delete({
      where: { id },
    });
  }
}