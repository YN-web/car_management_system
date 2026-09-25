import { Injectable,  ForbiddenException} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) { }

  create(createRoleDto: CreateRoleDto) {
    return this.prisma.role.create({
      data: createRoleDto,
    });
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
  //update
 async update(id: string, updateRoleDto: UpdateRoleDto) {
  const role = await this.prisma.role.findUnique({
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

  return this.prisma.role.update({
    where: { id },
    data: updateRoleDto,
  });
}
  //delete
async remove(id: string) {
  const role = await this.prisma.role.findUnique({
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

  return this.prisma.role.delete({
    where: { id },
  });
}

  async assignPermission(id: string, permissionId: string) {
  const role = await this.prisma.role.findUnique({
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

  return this.prisma.rolePermission.create({
    data: {
      roleId: id,
      permissionId: permissionId,
    },
  });
}
}