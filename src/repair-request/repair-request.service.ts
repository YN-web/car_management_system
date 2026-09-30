import { Injectable, NotFoundException,ConflictException,   ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRepairRequestDto } from './dto/create-repair-request.dto';
import { UpdateRepairRequestDto } from './dto/update-repair-request.dto';

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

    return this.prisma.repairRequest.create({
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
}
};
  
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
}