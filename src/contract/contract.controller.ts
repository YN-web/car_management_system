import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
  constructor(private readonly contractService: ContractService) {}

  @CheckAbility('create', 'Contract')
  @Post()
  create(@Body() dto: CreateContractDto) {
    return this.contractService.create(dto);
  }

  @CheckAbility('read', 'Contract')
  @Get()
  findAll() {
    return this.contractService.findAll();
  }

  @CheckAbility('read', 'Contract')
  @Get('expiring')
  findExpiring() {
  return this.contractService.findExpiring();
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
  ) {
    return this.contractService.update(id, dto);
  }

  @CheckAbility('delete', 'Contract')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contractService.remove(id);
  }
}