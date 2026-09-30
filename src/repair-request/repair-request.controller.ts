import {
  Body,
  Controller,
  Param,
  Get,
  Delete,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RepairRequestService } from './repair-request.service';
import { CreateRepairRequestDto } from './dto/create-repair-request.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { AbilityGuard } from '../casl/ability/ability.guard';
import { CheckAbility } from '../casl/ability/ability.decorator';
import { UpdateRepairRequestDto } from './dto/update-repair-request.dto';


@Controller('repair-request')
@UseGuards(JwtAuthGuard, AbilityGuard)
export class RepairRequestController {
  constructor(
    private readonly repairRequestService: RepairRequestService,
  ) {}

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

@Get('my')
@CheckAbility('read', 'RepairRequest')
findMyRequests(@Req() req: any) {
  return this.repairRequestService.findMyRequests(
    req.user.id,
  );
}
}