import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnterpriseDto } from './dto/create-enterprise.dto';
import { UpdateEnterpriseDto } from './dto/update-enterprise.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class EnterpriseService {
  constructor(
    private prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    createEnterpriseDto: CreateEnterpriseDto,
    userId: string,
  ) {
    const enterprise = await this.prisma.enterprise.create({
      data: createEnterpriseDto,
    });

    await this.auditService.log(
      'CREATE',
      'Enterprise',
      enterprise.id,
      userId,
    );

    return enterprise;
  }

  async findAll(
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    const skip = (page - 1) * limit;

    const allowedSortFields = [
      'createdAt',
      'name',
      'isActive',
    ];

    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const [enterprises, total] =
      await this.prisma.$transaction([
        this.prisma.enterprise.findMany({
          include: {
            users: {
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

        this.prisma.enterprise.count(),
      ]);

    return {
      data: enterprises,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const enterprise =
      await this.prisma.enterprise.findUnique({
        where: { id },
        include: { users: true },
      });

    if (!enterprise) {
      throw new NotFoundException(
        `Enterprise with ID ${id} not found`,
      );
    }

    return enterprise;
  }

  async update(
    id: string,
    updateEnterpriseDto: UpdateEnterpriseDto,
    userId: string,
  ) {
    const enterprise =
      await this.prisma.enterprise.findUnique({
        where: { id },
      });

    if (!enterprise) {
      throw new NotFoundException(
        `Enterprise with ID ${id} not found`,
      );
    }

    const updated =
      await this.prisma.enterprise.update({
        where: { id },
        data: updateEnterpriseDto,
      });

    await this.auditService.log(
      'UPDATE',
      'Enterprise',
      updated.id,
      userId,
    );

    return updated;
  }

  async deactivate(id: string, userId: string) {
    const enterprise =
      await this.prisma.enterprise.findUnique({
        where: { id },
      });

    if (!enterprise) {
      throw new NotFoundException(
        `Enterprise with ID ${id} not found`,
      );
    }

    const updated =
      await this.prisma.enterprise.update({
        where: { id },
        data: {
          isActive: false,
        },
      });

    await this.auditService.log(
      'DEACTIVATE',
      'Enterprise',
      updated.id,
      userId,
    );

    return updated;
  }


async findOptions() {
  return this.prisma.enterprise.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

}