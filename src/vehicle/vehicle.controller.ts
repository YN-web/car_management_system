import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { AbilityGuard } from '../casl/ability/ability.guard';
import { CheckAbility } from '../casl/ability/ability.decorator';

@Controller('vehicle')
@UseGuards(JwtAuthGuard, AbilityGuard)
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @CheckAbility('create', 'Vehicle')
  @Post()
  create(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehicleService.create(createVehicleDto);
  }

  @CheckAbility('read', 'Vehicle')
  @Get()
  findAll() {
    return this.vehicleService.findAll();
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
  ) {
    return this.vehicleService.update(id, updateVehicleDto);
  }

  @CheckAbility('delete', 'Vehicle')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.vehicleService.remove(id);
  }
}