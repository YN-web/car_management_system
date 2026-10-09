
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
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

  // Find and validate an active user making a request.
  private async getActiveActor(userId: string) {
    const actor = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!actor) {
      throw new NotFoundException('Requesting user not found');
    }

    if (!actor.isActive) {
      throw new ForbiddenException(
        'Inactive users cannot perform this action',
      );
    }

    return actor;
  }

  // Only an active Super_Admin may perform privileged changes.
  private async requireSuperAdmin(userId: string) {
    const actor = await this.getActiveActor(userId);

    if (!actor.role.isSuperAdmin) {
      throw new ForbiddenException(
        'Only an active Super_Admin can perform this action',
      );
    }

    return actor;
  }

  // Validate an enterprise and ensure it is active.
  private async validateEnterprise(enterpriseId: string) {
    const enterprise = await this.prisma.enterprise.findUnique({
      where: { id: enterpriseId },
    });

    if (!enterprise) {
      throw new NotFoundException('Enterprise not found');
    }

    if (!enterprise.isActive) {
      throw new BadRequestException(
        'Cannot assign a user to an inactive enterprise',
      );
    }

    return enterprise;
  }

  // CREATE USER
  async create(createUserDto: CreateUserDto, userId: string) {
    const creator = await this.getActiveActor(userId);

    if (!createUserDto.roleId) {
      throw new BadRequestException('Role is required');
    }

    const requestedRole = await this.prisma.role.findUnique({
      where: { id: createUserDto.roleId },
    });

    if (!requestedRole) {
      throw new NotFoundException('Role not found');
    }

    if (requestedRole.isSuperAdmin && !creator.role.isSuperAdmin) {
      throw new ForbiddenException(
        'Only an active Super_Admin can create another Super_Admin',
      );
    }

    if (
      requestedRole.isSuperAdmin &&
      !creator.role.isSuperAdmin
    ) {
      throw new ForbiddenException(
        'Only an active Super_Admin can create another Super_Admin',
      );
    }

    if (
      !requestedRole.isSuperAdmin &&
      !createUserDto.enterpriseId
    ) {
      throw new BadRequestException(
        'Enterprise is required for non-Super_Admin users',
      );
    }

    if (createUserDto.enterpriseId) {
      await this.validateEnterprise(createUserDto.enterpriseId);
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException(
        'A user with this email already exists',
      );
    }

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      10,
    );

    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        password: hashedPassword,
        roleId: requestedRole.id,
        enterpriseId: createUserDto.enterpriseId ?? null,
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

  // RECOVER SUPER_ADMIN
  async recoverSuperAdmin(
    data: {
      name: string;
      email: string;
      password: string;
      enterpriseId?: string;
      recoverySecret: string;
    },
  ) {
    const configuredSecret =
      process.env.SUPER_ADMIN_RECOVERY_SECRET;

    if (
      !configuredSecret ||
      data.recoverySecret !== configuredSecret
    ) {
      throw new ForbiddenException(
        'Invalid recovery credentials',
      );
    }

    const activeSuperAdmin = await this.prisma.user.findFirst({
      where: {
        isActive: true,
        role: { isSuperAdmin: true },
      },
    });

    if (activeSuperAdmin) {
      throw new ConflictException(
        'An active Super_Admin already exists',
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException(
        'A user with this email already exists',
      );
    }

    if (data.enterpriseId) {
      await this.validateEnterprise(data.enterpriseId);
    }

    const superAdminRole = await this.prisma.role.findFirst({
      where: { isSuperAdmin: true },
    });

    if (!superAdminRole) {
      throw new NotFoundException(
        'Super_Admin role has not been created',
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        enterpriseId: data.enterpriseId ?? null,
        roleId: superAdminRole.id,
        isActive: true,
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
      'RECOVER_SUPER_ADMIN',
      'User',
      user.id,
      user.id,
    );

    return user;
  }

  // GET ALL USERS
  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
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

  // GET ONE USER
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
      throw new NotFoundException(
        `User with ID ${id} not found`,
      );
    }

    // Never return the password hash.
    const { password, ...safeUser } = user;
    return safeUser;
  }

  // UPDATE USER
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    userId: string,
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const actor = await this.getActiveActor(userId);

    const changesRole =
      updateUserDto.roleId !== undefined;

    const changesEnterprise =
      Object.prototype.hasOwnProperty.call(
        updateUserDto,
        'enterpriseId',
      );

    // Only Super_Admin can change roles or enterprise assignments.
    if (changesRole || changesEnterprise) {
      if (!actor.role.isSuperAdmin) {
        throw new ForbiddenException(
          'Only an active Super_Admin can change user roles or enterprise assignments',
        );
      }
    }

    let targetRole = existingUser.role;

    if (changesRole) {
      const role = await this.prisma.role.findUnique({
        where: { id: updateUserDto.roleId },
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      targetRole = role;
    }

    // Regular users must always belong to an enterprise.
    let targetEnterpriseId = existingUser.enterpriseId;

    if (changesEnterprise) {
      targetEnterpriseId = updateUserDto.enterpriseId ?? null;
    }

    if (!targetRole.isSuperAdmin && !targetEnterpriseId) {
      throw new BadRequestException(
        'Enterprise is required for non-Super_Admin users',
      );
    }

    if (targetEnterpriseId) {
      await this.validateEnterprise(targetEnterpriseId);
    }

    if (updateUserDto.email) {
      const emailOwner = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (emailOwner && emailOwner.id !== id) {
        throw new ConflictException(
          'A user with this email already exists',
        );
      }
    }

    // Do not spread the DTO into Prisma data: only allow intended fields.
    const updateData: {
      name?: string;
      email?: string;
      password?: string;
      roleId?: string;
      enterpriseId?: string | null;
    } = {};

    if (updateUserDto.name !== undefined) {
      updateData.name = updateUserDto.name;
    }

    if (updateUserDto.email !== undefined) {
      updateData.email = updateUserDto.email;
    }

    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(
        updateUserDto.password,
        10,
      );
    }

    if (changesRole) {
      updateData.roleId = targetRole.id;
    }

    if (changesEnterprise) {
      updateData.enterpriseId = targetEnterpriseId;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
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
      'UPDATE',
      'User',
      updated.id,
      userId,
    );

    return updated;
  }

  // DEACTIVATE USER
  async deactivate(id: string, userId: string) {
    const actor = await this.getActiveActor(userId);

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (!user.isActive) {
      throw new ConflictException('User is already inactive');
    }

    // Only Super_Admin may deactivate another Super_Admin.
    if (user.role.isSuperAdmin && !actor.role.isSuperAdmin) {
      throw new ForbiddenException(
        'Only a Super_Admin can deactivate another Super_Admin',
      );
    }

    // Never allow the last active Super_Admin to be deactivated.
    if (user.role.isSuperAdmin) {
      const activeSuperAdminCount =
        await this.prisma.user.count({
          where: {
            isActive: true,
            role: { isSuperAdmin: true },
          },
        });

      if (activeSuperAdminCount <= 1) {
        throw new BadRequestException(
          'Cannot deactivate the last active Super_Admin',
        );
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
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
