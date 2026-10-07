import {
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    createRoleDto: CreateRoleDto,
    userId: string,
  ) {
    const role =
      await this.prisma.role.create({
        data: createRoleDto,
      });

    await this.auditService.log(
      'CREATE',
      'Role',
      role.id,
      userId,
    );

    return role;
  }

  findAll() {
    return this.prisma.role.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            roleId: true,
            enterpriseId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.role.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            roleId: true,
            enterpriseId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    updateRoleDto: UpdateRoleDto,
    userId: string,
  ) {
    const role =
      await this.prisma.role.findUnique({
        where: { id },
      });

    if (!role) {
      throw new Error('Role not found');
    }

    if (role.isSuperAdmin) {
      throw new ForbiddenException(
        'Super_Admin role cannot be modified',
      );
    }

    const updated =
      await this.prisma.role.update({
        where: { id },
        data: updateRoleDto,
      });

    await this.auditService.log(
      'UPDATE',
      'Role',
      updated.id,
      userId,
    );

    return updated;
  }

  async remove(
    id: string,
    userId: string,
  ) {
    const role =
      await this.prisma.role.findUnique({
        where: { id },
      });

    if (!role) {
      throw new Error('Role not found');
    }

    if (role.isSuperAdmin) {
      throw new ForbiddenException(
        'Super_Admin role cannot be deleted',
      );
    }

    await this.auditService.log(
      'DELETE',
      'Role',
      role.id,
      userId,
    );

    return this.prisma.role.delete({
      where: { id },
    });
  }

  async assignPermission(
    id: string,
    permissionId: string,
    userId: string,
  ) {
    const role =
      await this.prisma.role.findUnique({
        where: { id },
      });

    if (!role) {
      throw new Error('Role not found');
    }

    if (role.isSuperAdmin) {
      throw new ForbiddenException(
        'Permissions cannot be assigned to Super_Admin',
      );
    }

    const rolePermission =
      await this.prisma.rolePermission.create({
        data: {
          roleId: id,
          permissionId: permissionId,
        },
      });

    await this.auditService.log(
      'ASSIGN_PERMISSION',
      'Role',
      role.id,
      userId,
    );

    return rolePermission;
  }
}