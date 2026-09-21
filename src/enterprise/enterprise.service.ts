import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnterpriseDto } from './dto/create-enterprise.dto';
import { UpdateEnterpriseDto } from './dto/update-enterprise.dto';

@Injectable()
export class EnterpriseService {
  constructor(private prisma: PrismaService) {}

  async create(createEnterpriseDto: CreateEnterpriseDto) {
    return this.prisma.enterprise.create({
      data: createEnterpriseDto,
    });
  }

  async findAll() {
    return this.prisma.enterprise.findMany({
      include: {
        users: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const enterprise = await this.prisma.enterprise.findUnique({
      where: { id },
      include: { users: true },
    });

    if (!enterprise) {
      throw new NotFoundException(`Enterprise with ID ${id} not found`);
    }

    return enterprise;
  }

 async update(id: string, updateEnterpriseDto: UpdateEnterpriseDto) {
  const enterprise = await this.prisma.enterprise.findUnique({
    where: { id },
  });

  if (!enterprise) {
    throw new NotFoundException(`Enterprise with ID ${id} not found`);
  }

  return this.prisma.enterprise.update({
    where: { id },
    data: updateEnterpriseDto,
  });
}

  async deactivate(id: string) {
    const enterprise = await this.prisma.enterprise.findUnique({
      where: { id },
    });

    if (!enterprise) {
      throw new NotFoundException(`Enterprise with ID ${id} not found`);
    }

    return this.prisma.enterprise.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }
}