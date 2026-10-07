import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

import { CreateRepairRequestDto } from './dto/create-repair-request.dto';
import { UpdateRepairRequestDto } from './dto/update-repair-request.dto';
import { RejectRepairRequestDto } from './dto/reject-repair-request.dto';

@Injectable()
export class RepairRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // CREATE
  async create(
    dto: CreateRepairRequestDto,
    requesterId: string,
  ) {
    const requester =
      await this.prisma.user.findUnique({
        where: {
          id: requesterId,
        },
      });

    if (!requester) {
      throw new NotFoundException(
        'Requester not found',
      );
    }

    const vehicle =
      await this.prisma.vehicle.findUnique({
        where: {
          id: dto.vehicleId,
        },
      });

    if (!vehicle) {
      throw new NotFoundException(
        'Vehicle not found',
      );
    }

    if (
      vehicle.enterpriseId !==
      requester.enterpriseId
    ) {
      throw new ForbiddenException(
        'Vehicle does not belong to your enterprise',
      );
    }

    const garage =
      await this.prisma.garage.findUnique({
        where: {
          id: dto.garageId,
        },
      });

    if (!garage) {
      throw new NotFoundException(
        'Garage not found',
      );
    }

    const repairRequest =
      await this.prisma.repairRequest.create({
        data: {
          vehicleId: dto.vehicleId,
          garageId: dto.garageId,
          requesterId,
          description: dto.description,
          status: 'pending_approval',
        },

        include: {
          vehicle: true,
          garage: true,
          requester: true,
        },
      });

    await this.prisma.statusLog.create({
      data: {
        repairRequestId: repairRequest.id,
        fromStatus: 'none',
        toStatus: 'pending_approval',
        changedById: requesterId,
      },
    });

    await this.auditService.log(
      'CREATE',
      'RepairRequest',
      repairRequest.id,
      requesterId,
    );

    return repairRequest;
  }

  // UPDATE
  async update(
    id: string,
    requesterId: string,
    dto: UpdateRepairRequestDto,
  ) {
    const request =
      await this.prisma.repairRequest.findUnique({
        where: {
          id,
        },

        include: {
          vehicle: true,
        },
      });

    if (!request) {
      throw new NotFoundException(
        'Repair request not found',
      );
    }

    if (request.requesterId !== requesterId) {
      throw new ForbiddenException(
        'You can only update your own repair requests',
      );
    }

    if (request.status !== 'pending_approval') {
      throw new ConflictException(
        'Only pending repair requests can be updated',
      );
    }

    const updatedRequest =
      await this.prisma.repairRequest.update({
        where: {
          id,
        },

        data: dto,

        include: {
          vehicle: true,
          garage: true,
          requester: true,
        },
      });

    await this.auditService.log(
      'UPDATE',
      'RepairRequest',
      updatedRequest.id,
      requesterId,
    );

    return updatedRequest;
  }

  // DELETE
  async remove(
    id: string,
    requesterId: string,
  ) {
    const request =
      await this.prisma.repairRequest.findUnique({
        where: {
          id,
        },
      });

    if (!request) {
      throw new NotFoundException(
        'Repair request not found',
      );
    }

    if (request.requesterId !== requesterId) {
      throw new ForbiddenException(
        'You can only delete your own repair requests',
      );
    }

    if (request.status !== 'pending_approval') {
      throw new ConflictException(
        'Only pending repair requests can be deleted',
      );
    }

    await this.auditService.log(
      'DELETE',
      'RepairRequest',
      request.id,
      requesterId,
    );

    await this.prisma.repairRequest.delete({
      where: {
        id,
      },
    });

    return {
      message:
        'Repair request deleted successfully',
    };
  }

  // DRIVER / REQUESTER LIST
  async findMyRequests(
    requesterId: string,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    page = Math.max(1, page);
    limit = Math.min(
      Math.max(1, limit),
      100,
    );

    const skip = (page - 1) * limit;

    const allowedSortFields = [
      'createdAt',
      'updatedAt',
      'status',
    ];

    const safeSortBy =
      allowedSortFields.includes(sortBy)
        ? sortBy
        : 'createdAt';

    const where = {
      requesterId,
    };

    const [requests, total] =
      await this.prisma.$transaction([
        this.prisma.repairRequest.findMany({
          where,

          include: {
            vehicle: true,
            garage: true,
          },

          orderBy: {
            [safeSortBy]: sortOrder,
          },

          skip,
          take: limit,
        }),

        this.prisma.repairRequest.count({
          where,
        }),
      ]);

    return {
      data: requests,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(
          total / limit,
        ),
      },
    };
  }

  // ADMIN / FLEET MANAGER / SUPER ADMIN LIST
  async findAll(
    enterpriseId: string,
    isSuperAdmin = false,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
    status?: string,
    garageId?: string,
    requesterId?: string,
  ) {
    page = Math.max(1, page);
    limit = Math.min(
      Math.max(1, limit),
      100,
    );

    const skip = (page - 1) * limit;

    const allowedSortFields = [
      'createdAt',
      'updatedAt',
      'status',
    ];

    const safeSortBy =
      allowedSortFields.includes(sortBy)
        ? sortBy
        : 'createdAt';

    const where = {
      ...(isSuperAdmin
        ? {}
        : {
            vehicle: {
              enterpriseId,
            },
          }),

      ...(status
        ? {
            status,
          }
        : {}),

      ...(garageId
        ? {
            garageId,
          }
        : {}),

      ...(requesterId
        ? {
            requesterId,
          }
        : {}),
    };

    const [requests, total] =
      await this.prisma.$transaction([
        this.prisma.repairRequest.findMany({
          where,

          include: {
            vehicle: true,
            garage: true,

            requester: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },

            approver: {
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

        this.prisma.repairRequest.count({
          where,
        }),
      ]);

    return {
      data: requests,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(
          total / limit,
        ),
      },
    };
  }

  // APPROVE
  async approve(
    id: string,
    approverId: string,
  ) {
    const approver =
      await this.prisma.user.findUnique({
        where: {
          id: approverId,
        },
      });

    if (!approver) {
      throw new NotFoundException(
        'Approver not found',
      );
    }

    const request =
      await this.prisma.repairRequest.findUnique({
        where: {
          id,
        },

        include: {
          vehicle: true,
        },
      });

    if (!request) {
      throw new NotFoundException(
        'Repair request not found',
      );
    }

    if (
      request.vehicle.enterpriseId !==
      approver.enterpriseId
    ) {
      throw new ForbiddenException(
        'Repair request does not belong to your enterprise',
      );
    }

    if (
      request.status !== 'pending_approval'
    ) {
      throw new ConflictException(
        'Only pending repair requests can be approved',
      );
    }

    const result =
      await this.prisma.$transaction(
        async (tx) => {
          const updatedRequest =
            await tx.repairRequest.update({
              where: {
                id,
              },

              data: {
                status: 'approved',
                approverId,
                approvedAt: new Date(),
              },

              include: {
                vehicle: true,
                garage: true,
                requester: true,
              },
            });

          await tx.vehicle.update({
            where: {
              id: request.vehicle.id,
            },

            data: {
              status: 'in_repair',
            },
          });

          await tx.statusLog.create({
            data: {
              repairRequestId: id,
              fromStatus:
                'pending_approval',
              toStatus: 'approved',
              changedById: approverId,
            },
          });

          return updatedRequest;
        },
      );

    await this.auditService.log(
      'APPROVE',
      'RepairRequest',
      result.id,
      approverId,
    );

    return result;
  }

  // START / IN PROGRESS
async start(
  id: string,
  userId: string,
) {
  const user =
    await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

  if (!user) {
    throw new NotFoundException(
      'User not found',
    );
  }

  const request =
    await this.prisma.repairRequest.findUnique({
      where: {
        id,
      },
      include: {
        vehicle: true,
      },
    });

  if (!request) {
    throw new NotFoundException(
      'Repair request not found',
    );
  }

  if (
    request.vehicle.enterpriseId !==
    user.enterpriseId
  ) {
    throw new ForbiddenException(
      'Repair request does not belong to your enterprise',
    );
  }

  if (request.status !== 'approved') {
    throw new ConflictException(
      'Only approved repairs can be started',
    );
  }

  const result =
    await this.prisma.$transaction(
      async (tx) => {
        const updatedRequest =
          await tx.repairRequest.update({
            where: {
              id,
            },
            data: {
              status: 'in_progress',
            },
            include: {
              vehicle: true,
              garage: true,
              requester: true,
            },
          });

        await tx.statusLog.create({
          data: {
            repairRequestId: id,
            fromStatus: 'in_progress',

            toStatus: 'in_progress',
            changedById: userId,
          },
        });

        return updatedRequest;
      },
    );

  await this.auditService.log(
    'START',
    'RepairRequest',
    result.id,
    userId,
  );

  return result;
}

  // REJECT
  async reject(
    id: string,
    approverId: string,
    dto: RejectRepairRequestDto,
  ) {
    const approver =
      await this.prisma.user.findUnique({
        where: {
          id: approverId,
        },
      });

    if (!approver) {
      throw new NotFoundException(
        'Approver not found',
      );
    }

    const request =
      await this.prisma.repairRequest.findUnique({
        where: {
          id,
        },

        include: {
          vehicle: true,
        },
      });

    if (!request) {
      throw new NotFoundException(
        'Repair request not found',
      );
    }

    if (
      request.vehicle.enterpriseId !==
      approver.enterpriseId
    ) {
      throw new ForbiddenException(
        'Repair request does not belong to your enterprise',
      );
    }

    if (
      request.status !== 'pending_approval'
    ) {
      throw new ConflictException(
        'Only pending repair requests can be rejected',
      );
    }

    const updatedRequest =
      await this.prisma.repairRequest.update({
        where: {
          id,
        },

        data: {
          status: 'rejected',
          approverId,
          rejectionReason:
            dto.rejectionReason,
        },

        include: {
          vehicle: true,
          garage: true,
          requester: true,
        },
      });

    await this.prisma.statusLog.create({
      data: {
        repairRequestId: id,
        fromStatus:
          'pending_approval',
        toStatus: 'rejected',
        changedById: approverId,
      },
    });

    await this.auditService.log(
      'REJECT',
      'RepairRequest',
      updatedRequest.id,
      approverId,
    );

    return updatedRequest;
  }

  // HISTORY
  async getHistory(
    id: string,
    enterpriseId: string,
    page = 1,
    limit = 10,
    sortOrder: 'asc' | 'desc' = 'asc',
  ) {
    page = Math.max(1, page);
    limit = Math.min(
      Math.max(1, limit),
      100,
    );

    const request =
      await this.prisma.repairRequest.findFirst({
        where: {
          id,

          vehicle: {
            enterpriseId,
          },
        },
      });

    if (!request) {
      throw new NotFoundException(
        'Repair request not found',
      );
    }

    const skip = (page - 1) * limit;

    const where = {
      repairRequestId: id,
    };

    const [history, total] =
      await this.prisma.$transaction([
        this.prisma.statusLog.findMany({
          where,

          orderBy: {
            timestamp: sortOrder,
          },

          skip,
          take: limit,

          include: {
            changedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),

        this.prisma.statusLog.count({
          where,
        }),
      ]);

    return {
      data: history,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(
          total / limit,
        ),
      },
    };
  }

  // COMPLETE
  async complete(
    id: string,
    userId: string,
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    const request =
      await this.prisma.repairRequest.findUnique({
        where: {
          id,
        },

        include: {
          vehicle: true,
        },
      });

    if (!request) {
      throw new NotFoundException(
        'Repair request not found',
      );
    }

    if (
      request.vehicle.enterpriseId !==
      user.enterpriseId
    ) {
      throw new ForbiddenException(
        'Repair request does not belong to your enterprise',
      );
    }
if (request.status !== 'in_progress') {
  throw new ConflictException(
    'Only in-progress repairs can be completed',
  );
}
    const result =
      await this.prisma.$transaction(
        async (tx) => {
          const updatedRequest =
            await tx.repairRequest.update({
              where: {
                id,
              },

              data: {
                status: 'completed',
              },

              include: {
                vehicle: true,
                garage: true,
                requester: true,
              },
            });

          await tx.vehicle.update({
            where: {
              id: request.vehicle.id,
            },

            data: {
              status: 'active',
            },
          });

          await tx.statusLog.create({
            data: {
              repairRequestId: id,
              fromStatus: 'in_progress',

              toStatus: 'completed',
              changedById: userId,
            },
          });

          return updatedRequest;
        },
      );

    await this.auditService.log(
      'COMPLETE',
      'RepairRequest',
      result.id,
      userId,
    );

    return result;
  }
}
