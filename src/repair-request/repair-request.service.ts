import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRepairRequestDto } from './dto/create-repair-request.dto';
import { UpdateRepairRequestDto } from './dto/update-repair-request.dto';
import { RejectRepairRequestDto } from './dto/reject-repair-request.dto';

@Injectable()
export class RepairRequestService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRepairRequestDto, requesterId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const garage = await this.prisma.garage.findUnique({
      where: { id: dto.garageId },
    });

    if (!garage) {
      throw new NotFoundException('Garage not found');
    }

    const repairRequest = await this.prisma.repairRequest.create({
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

    return repairRequest;
  }

  async update(
    id: string,
    requesterId: string,
    dto: UpdateRepairRequestDto,
  ) {
    const request = await this.prisma.repairRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Repair request not found');
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

    return this.prisma.repairRequest.update({
      where: { id },
      data: dto,
      include: {
        vehicle: true,
        garage: true,
        requester: true,
      },
    });
  }

  async remove(id: string, requesterId: string) {
    const request = await this.prisma.repairRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Repair request not found');
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

    await this.prisma.repairRequest.delete({
      where: { id },
    });

    return {
      message: 'Repair request deleted successfully',
    };
  }

  async findMyRequests(requesterId: string) {
    return this.prisma.repairRequest.findMany({
      where: {
        requesterId,
      },
      include: {
        vehicle: true,
        garage: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async approve(id: string, approverId: string) {
    const request = await this.prisma.repairRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Repair request not found');
    }

    if (request.status !== 'pending_approval') {
      throw new ConflictException(
        'Only pending repair requests can be approved',
      );
    }

    const updatedRequest = await this.prisma.repairRequest.update({
      where: { id },
      data: {
        status: 'approved',
        approverId,
        approvedAt: new Date(),
      },
    });

    await this.prisma.statusLog.create({
      data: {
        repairRequestId: id,
        fromStatus: 'pending_approval',
        toStatus: 'approved',
        changedById: approverId,
      },
    });

    return updatedRequest;
  }

  async reject(
    id: string,
    approverId: string,
    dto: RejectRepairRequestDto,
  ) {
    const request = await this.prisma.repairRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Repair request not found');
    }

    if (request.status !== 'pending_approval') {
      throw new ConflictException(
        'Only pending repair requests can be rejected',
      );
    }

    const updatedRequest = await this.prisma.repairRequest.update({
      where: { id },
      data: {
        status: 'rejected',
        approverId,
        rejectionReason: dto.rejectionReason,
      },
    });

    await this.prisma.statusLog.create({
      data: {
        repairRequestId: id,
        fromStatus: 'pending_approval',
        toStatus: 'rejected',
        changedById: approverId,
      },
    });

    return updatedRequest;
  }

  async getHistory(id: string) {
    const request = await this.prisma.repairRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Repair request not found');
    }

    return this.prisma.statusLog.findMany({
      where: { repairRequestId: id },
      orderBy: {
        timestamp: 'asc',
      },
      include: {
        changedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}