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
} from '@nestjs/common';
import { GarageService } from './garage.service';
import { CreateGarageDto, UpdateGarageDto } from './dto/garage.dto';

@Controller('garages') // Sets the route prefix to /garages
export class GarageController {
  constructor(private readonly garageService: GarageService) {}

  // POST /garages -> Creates a new garage
  @Post()
  create(@Body() dto: CreateGarageDto) {
    return this.garageService.create(dto);
  }

  // GET /garages -> Lists all garages
  @Get()
  findAll() {
    return this.garageService.findAll();
  }

  // GET /garages/:id -> Finds garage by ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.garageService.findOne(id);
  }

  // PATCH /garages/:id -> Updates garage by ID
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGarageDto) {
    return this.garageService.update(id, dto);
  }

  // DELETE /garages/:id -> Deletes garage by ID and returns HTTP 204 No Content
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.garageService.remove(id);
  }
}