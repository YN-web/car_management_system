import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  Req,
} from '@nestjs/common';

import { VehicleService } from './vehicle.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { AbilityGuard } from '../casl/ability/ability.guard';
import { CheckAbility } from '../casl/ability/ability.decorator';

import type { Response, Request } from 'express';

@Controller('vehicle')
@UseGuards(JwtAuthGuard, AbilityGuard)
export class VehicleController {
  constructor(
    private readonly vehicleService: VehicleService,
  ) {}

  @CheckAbility('create', 'Vehicle')
  @Post()
  create(
    @Body() createVehicleDto: CreateVehicleDto,
    @Req() req: Request,
  ) {
    return this.vehicleService.create(
      createVehicleDto,
      (req.user as any).id,
    );
  }

  @CheckAbility('read', 'Vehicle')
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('brand') brand?: string,
    @Query('model') model?: string,
    @Query('year') year?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.vehicleService.findAll(
      search,
      status,
      brand,
      model,
      year,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      sortBy || 'createdAt',
      sortOrder || 'desc',
    );
  }

  @CheckAbility('read', 'Vehicle')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehicleService.findOne(id);
  }

  @CheckAbility('update', 'Vehicle')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @Req() req: Request,
  ) {
    return this.vehicleService.update(
      id,
      updateVehicleDto,
      (req.user as any).id,
    );
  }

  @CheckAbility('delete', 'Vehicle')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.vehicleService.remove(
      id,
      (req.user as any).id,
    );
  }

  @Get('export/csv')
  @CheckAbility('read', 'Vehicle')
  async exportCsv(@Res() res: Response) {
    const csv = await this.vehicleService.exportCsv();

    res.header('Content-Type', 'text/csv');
    res.attachment('vehicles.csv');
    res.send(csv);
  }
}