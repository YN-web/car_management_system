import { Injectable } from '@nestjs/common';
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
  update(id: string, updateRoleDto: UpdateRoleDto) {
    return this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
    });
  }
  //delete
  remove(id: string) {
    return this.prisma.role.delete({
      where: { id },
    });
  }

  assignPermission(id: string, permissionId: string) {
    return this.prisma.rolePermission.create({
      data: {
        roleId: id,
        permissionId: permissionId,
      },
    });
  }

}