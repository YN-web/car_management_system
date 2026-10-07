import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';

import { GarageService } from './garage.service';
import {
  CreateGarageDto,
  UpdateGarageDto,
} from './dto/garage.dto';

import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { AbilityGuard } from '../casl/ability/ability.guard';
import { CheckAbility } from '../casl/ability/ability.decorator';

@Controller('garages')
export class GarageController {
  constructor(
    private readonly garageService: GarageService,
  ) {}

  @UseGuards(JwtAuthGuard, AbilityGuard)
  @CheckAbility('create', 'Garage')
  @Post()
  create(
    @Body() dto: CreateGarageDto,
    @Req() req: any,
  ) {
    return this.garageService.create(
      dto,
      req.user.id,
    );
  }

  @UseGuards(JwtAuthGuard, AbilityGuard)
  @CheckAbility('read', 'Garage')
  @Get()
  findAll() {
    return this.garageService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.garageService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, AbilityGuard)
  @CheckAbility('update', 'Garage')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGarageDto,
    @Req() req: any,
  ) {
    return this.garageService.update(
      id,
      dto,
      req.user.id,
    );
  }

  @UseGuards(JwtAuthGuard, AbilityGuard)
  @CheckAbility('delete', 'Garage')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.garageService.remove(
      id,
      req.user.id,
    );
  }
}