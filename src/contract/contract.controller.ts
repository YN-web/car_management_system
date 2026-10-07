import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ContractService } from './contract.service';

import {
  CreateContractDto,
  UpdateContractDto,
} from './dto/contract.dto';

import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { AbilityGuard } from '../casl/ability/ability.guard';
import { CheckAbility } from '../casl/ability/ability.decorator';

@Controller('contract')
@UseGuards(JwtAuthGuard, AbilityGuard)
export class ContractController {
  constructor(
    private readonly contractService: ContractService,
  ) {}

  @CheckAbility('create', 'Contract')
  @Post()
  
  create(
  @Body() dto: CreateContractDto,
  @Req() req: any,
) {
  return this.contractService.create(
    dto,
    req.user.id,
  );
}

  @CheckAbility('read', 'Contract')
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.contractService.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      sortBy || 'startDate',
      sortOrder || 'desc',
    );
  }

  @CheckAbility('read', 'Contract')
  @Get('expiring')
  findExpiring(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.contractService.findExpiring(
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      sortBy || 'endDate',
      sortOrder || 'asc',
    );
  }

  @CheckAbility('read', 'Contract')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contractService.findOne(id);
  }

  @CheckAbility('update', 'Contract')
  @Patch(':id')
  
  update(
  @Param('id') id: string,
  @Body() dto: UpdateContractDto,
  @Req() req: any,
) {
  return this.contractService.update(
    id,
    dto,
    req.user.id,
  );
}

  @CheckAbility('delete', 'Contract')
  @Delete(':id')
  remove(
  @Param('id') id: string,
  @Req() req: any,
) {
  return this.contractService.remove(
    id,
    req.user.id,
  );
}
}
