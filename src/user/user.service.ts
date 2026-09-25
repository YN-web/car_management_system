import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) { }

  async create(createUserDto: CreateUserDto) {
  const { password, ...userData } = createUserDto;

  const userCount = await this.prisma.user.count();

    let roleId: string;

if (userCount === 0) {
  const superAdminRole = await this.prisma.role.findFirst({
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
  if (!createUserDto.roleId) {
    throw new NotFoundException('Role is required');
  }

  roleId = createUserDto.roleId;
}

  if (userCount === 0) {
    const superAdminRole = await this.prisma.role.findFirst({
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
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  return this.prisma.user.create({
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
            isSuperAdmin: true
          }
        }
      },

    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
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
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }
  async update(id: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    return this.prisma.user.update({
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
  }

  async deactivate(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.prisma.user.update({
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
  }
}