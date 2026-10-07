import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    userId: string,
  ) {
    const { password, ...userData } =
      createUserDto;

    const userCount =
      await this.prisma.user.count();

    let roleId: string;

    // First user becomes Super_Admin
    if (userCount === 0) {
      const superAdminRole =
        await this.prisma.role.findFirst({
          where: {
            isSuperAdmin: true,
          },
        });

      if (!superAdminRole) {
        throw new NotFoundException(
          'Super_Admin role has not been created',
        );
      }

      roleId = superAdminRole.id;
    } else {
      // Other users must have a role
      if (!createUserDto.roleId) {
        throw new NotFoundException(
          'Role is required',
        );
      }

      // Other users must belong to an enterprise
      if (!createUserDto.enterpriseId) {
        throw new NotFoundException(
          'Enterprise is required',
        );
      }

      roleId = createUserDto.roleId;
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user =
      await this.prisma.user.create({
        data: {
          ...userData,
          roleId,
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          roleId: true,
          enterpriseId: true,
          createdAt: true,
        },
      });

    await this.auditService.log(
      'CREATE',
      'User',
      user.id,
      userId,
    );

    return user;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        roleId: true,
        enterpriseId: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true,
            isSuperAdmin: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const user =
      await this.prisma.user.findUnique({
        where: { id },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${id} not found`,
      );
    }

    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    userId: string,
  ) {
    if (updateUserDto.password) {
      updateUserDto.password =
        await bcrypt.hash(
          updateUserDto.password,
          10,
        );
    }

    const updated =
      await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
        select: {
          id: true,
          email: true,
          name: true,
          roleId: true,
          enterpriseId: true,
          updatedAt: true,
        },
      });

    await this.auditService.log(
      'UPDATE',
      'User',
      updated.id,
      userId,
    );

    return updated;
  }

  async deactivate(
    id: string,
    userId: string,
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: { id },
      });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${id} not found`,
      );
    }

    const updated =
      await this.prisma.user.update({
        where: { id },
        data: {
          isActive: false,
        },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          roleId: true,
          enterpriseId: true,
          updatedAt: true,
        },
      });

    await this.auditService.log(
      'DEACTIVATE',
      'User',
      updated.id,
      userId,
    );

    return updated;
  }
}