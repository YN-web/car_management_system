import {
  Body,
  Controller,
  Param,
  Get,
  Delete,
  Patch,
  Post,
  Req,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';

import { RepairRequestService } from './repair-request.service';

import { CreateRepairRequestDto } from './dto/create-repair-request.dto';
import { UpdateRepairRequestDto } from './dto/update-repair-request.dto';
import { RejectRepairRequestDto } from './dto/reject-repair-request.dto';

import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { AbilityGuard } from '../casl/ability/ability.guard';
import { CheckAbility } from '../casl/ability/ability.decorator';

@Controller('repair-request')
@UseGuards(JwtAuthGuard, AbilityGuard)
export class RepairRequestController {
  constructor(
    private readonly repairRequestService: RepairRequestService,
  ) {}

  // CREATE
  @Post()
  @CheckAbility('create', 'RepairRequest')
  create(
    @Body() dto: CreateRepairRequestDto,
    @Req() req: any,
  ) {
    return this.repairRequestService.create(
      dto,
      req.user.id,
    );
  }

  // ADMIN / FLEET MANAGER LIST
  @Get()
  @CheckAbility('read', 'RepairRequest')
  findAll(
    @Req() req: any,

    @Query('page') page?: string,
    @Query('limit') limit?: string,

    @Query('sortBy') sortBy?: string,
    @Query('sortOrder')
    sortOrder?: 'asc' | 'desc',

    @Query('status') status?: string,
    @Query('garageId') garageId?: string,
    @Query('requesterId')
    requesterId?: string,
  ) {
    if (req.user.role?.name === 'Driver') {
      throw new ForbiddenException(
        'Drivers can only view their own repair requests',
      );
    }

    return this.repairRequestService.findAll(
      req.user.enterpriseId,
      req.user.role?.isSuperAdmin === true,

      page ? Number(page) : 1,
      limit ? Number(limit) : 10,

      sortBy || 'createdAt',
      sortOrder || 'desc',

      status,
      garageId,
      requesterId,
    );
  }

  // DRIVER / REQUESTER LIST
  @Get('my')
  @CheckAbility('read', 'RepairRequest')
  findMyRequests(
    @Req() req: any,

    @Query('page') page?: string,
    @Query('limit') limit?: string,

    @Query('sortBy') sortBy?: string,
    @Query('sortOrder')
    sortOrder?: 'asc' | 'desc',
  ) {
    return this.repairRequestService.findMyRequests(
      req.user.id,

      page ? Number(page) : 1,
      limit ? Number(limit) : 10,

      sortBy || 'createdAt',
      sortOrder || 'desc',
    );
  }

  // UPDATE
  @Patch(':id')
  @CheckAbility('update', 'RepairRequest')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRepairRequestDto,
    @Req() req: any,
  ) {
    return this.repairRequestService.update(
      id,
      req.user.id,
      dto,
    );
  }

  // DELETE
  @Delete(':id')
  @CheckAbility('delete', 'RepairRequest')
  remove(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.repairRequestService.remove(
      id,
      req.user.id,
    );
  }

  // HISTORY
  @Get(':id/history')
  @CheckAbility('read', 'RepairRequest')
  getHistory(
    @Param('id') id: string,
    @Req() req: any,

    @Query('page') page?: string,
    @Query('limit') limit?: string,

    @Query('sortOrder')
    sortOrder?: 'asc' | 'desc',
  ) {
    return this.repairRequestService.getHistory(
      id,
      req.user.enterpriseId,

      page ? Number(page) : 1,
      limit ? Number(limit) : 10,

      sortOrder || 'asc',
    );
  }

  // APPROVE
  @Patch(':id/approve')
  @CheckAbility('approve', 'RepairRequest')
  approve(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.repairRequestService.approve(
      id,
      req.user.id,
    );
  }

  // START / IN PROGRESS
  @Patch(':id/start')
  @CheckAbility('update', 'RepairRequest')
  start(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.repairRequestService.start(
      id,
      req.user.id,
    );
  }

  // REJECT
  @Patch(':id/reject')
  @CheckAbility('approve', 'RepairRequest')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectRepairRequestDto,
    @Req() req: any,
  ) {
    return this.repairRequestService.reject(
      id,
      req.user.id,
      dto,
    );
  }

  // COMPLETE
  @Patch(':id/complete')
  @CheckAbility('complete', 'RepairRequest')
  complete(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.repairRequestService.complete(
      id,
      req.user.id,
    );
  }
}
