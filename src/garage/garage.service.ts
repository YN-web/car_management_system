import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGarageDto, UpdateGarageDto } from './dto/garage.dto';

@Injectable()
export class GarageService {
  // Inject PrismaService via constructor dependency injection
  constructor(private prisma: PrismaService) {}

  // 1. Create a new Garage record
  async create(dto: CreateGarageDto) {
    return this.prisma.garage.create({
      data: dto,
    });
  }

  // 2. Fetch all garages sorted alphabetically by name
  async findAll() {
    return this.prisma.garage.findMany({
      orderBy: { name: 'asc' },
    });
  }

  // 3. Fetch a single garage by its unique ID
  async findOne(id: string) {
    const garage = await this.prisma.garage.findUnique({
      where: { id },
    });

    // Throw a standard NestJS HTTP 404 exception if record doesn't exist
    if (!garage) {
      throw new NotFoundException(`Garage with ID ${id} not found`);
    }

    return garage;
  }

  // 4. Update an existing garage record
  async update(id: string, dto: UpdateGarageDto) {
    await this.findOne(id); // Ensures record exists before updating

    return this.prisma.garage.update({
      where: { id },
      data: dto,
    });
  }

  // 5. Delete a garage record
  async remove(id: string) {
    await this.findOne(id); // Ensures record exists before deleting

    return this.prisma.garage.delete({
      where: { id },
    });
  }
}