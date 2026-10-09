import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { EnterpriseService } from './enterprise.service';

import { CreateEnterpriseDto } from './dto/create-enterprise.dto';
import { UpdateEnterpriseDto } from './dto/update-enterprise.dto';

import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { AbilityGuard } from '../casl/ability/ability.guard';
import { CheckAbility } from '../casl/ability/ability.decorator';

@Controller('enterprise')
@UseGuards(JwtAuthGuard, AbilityGuard)
export class EnterpriseController {
  constructor(
    private readonly enterpriseService: EnterpriseService,
  ) {}

  @CheckAbility('create', 'Enterprise')
  @Post()
  create(
    @Body() createEnterpriseDto: CreateEnterpriseDto,
    @Req() req: any,
  ) {
    return this.enterpriseService.create(
      createEnterpriseDto,
      req.user.id,
    );
  }

  @CheckAbility('read', 'Enterprise')
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.enterpriseService.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      sortBy || 'createdAt',
      sortOrder || 'desc',
    );
  }


  @Get('options')
  @CheckAbility('read', 'Enterprise')
  findOptions() {
    return this.enterpriseService.findOptions();
  }


  @CheckAbility('read', 'Enterprise')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enterpriseService.findOne(id);
  }

  @CheckAbility('update', 'Enterprise')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEnterpriseDto: UpdateEnterpriseDto,
    @Req() req: any,
  ) {
    return this.enterpriseService.update(
      id,
      updateEnterpriseDto,
      req.user.id,
    );
  }

  @CheckAbility('update', 'Enterprise')
  @Patch(':id/deactivate')
  deactivate(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.enterpriseService.deactivate(
      id,
      req.user.id,
    );
  }
}