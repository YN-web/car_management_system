import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { PermissionService } from './permission.service';

import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { AbilityGuard } from '../casl/ability/ability.guard';
import { CheckAbility } from '../casl/ability/ability.decorator';

@Controller('permission')
@UseGuards(JwtAuthGuard, AbilityGuard)
export class PermissionController {
  constructor(
    private readonly permissionService: PermissionService,
  ) {}

  @CheckAbility('manage', 'Permission')
  @Post()
  create(
    @Body() createPermissionDto: CreatePermissionDto,
    @Req() req: any,
  ) {
    return this.permissionService.create(
      createPermissionDto,
      req.user.id,
    );
  }

  @CheckAbility('manage', 'Permission')
  @Get()
  findAll() {
    return this.permissionService.findAll();
  }

  @CheckAbility('manage', 'Permission')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permissionService.findOne(id);
  }

  @CheckAbility('manage', 'Permission')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
    @Req() req: any,
  ) {
    return this.permissionService.update(
      id,
      updatePermissionDto,
      req.user.id,
    );
  }

  @CheckAbility('manage', 'Permission')
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.permissionService.remove(
      id,
      req.user.id,
    );
  }
}