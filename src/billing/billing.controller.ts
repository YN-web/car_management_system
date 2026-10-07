import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { BillingService } from './billing.service';

import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { AbilityGuard } from '../casl/ability/ability.guard';
import { CheckAbility } from '../casl/ability/ability.decorator';

@Controller('billing')
@UseGuards(JwtAuthGuard, AbilityGuard)
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
  ) {}

  @Post()
  @CheckAbility('create', 'Billing')
  create(
    @Body()
    body: {
      repairRequestId: string;
      serviceType: string;
      grossAmount: number;
      invoiceRef: string;
    },
    @Req() req: any,
  ) {
    return this.billingService.create(
      body,
      req.user.id,
    );
  }

  @Get()
  @CheckAbility('read', 'Billing')
  findAll() {
    return this.billingService.findAll();
  }

  @Get(':id')
  @CheckAbility('read', 'Billing')
  findOne(@Param('id') id: string) {
    return this.billingService.findOne(id);
  }
}