import {
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    createPermissionDto: CreatePermissionDto,
    userId: string,
  ) {
    const permission =
      await this.prisma.permission.create({
        data: createPermissionDto,
      });

    await this.auditService.log(
      'CREATE',
      'Permission',
      permission.id,
      userId,
    );

    return permission;
  }

  findAll() {
    return this.prisma.permission.findMany({
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.permission.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    updatePermissionDto: UpdatePermissionDto,
    userId: string,
  ) {
    const permission =
      await this.prisma.permission.update({
        where: { id },
        data: updatePermissionDto,
      });

    await this.auditService.log(
      'UPDATE',
      'Permission',
      permission.id,
      userId,
    );

    return permission;
  }

  async remove(
    id: string,
    userId: string,
  ) {
    await this.prisma.permission.findUniqueOrThrow({
      where: { id },
    });

    await this.auditService.log(
      'DELETE',
      'Permission',
      id,
      userId,
    );

    return this.prisma.permission.delete({
      where: { id },
    });
  }
}