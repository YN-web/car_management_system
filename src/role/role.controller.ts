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

import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionDto } from './dto/assign-permission.dto';

import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { AbilityGuard } from '../casl/ability/ability.guard';
import { CheckAbility } from '../casl/ability/ability.decorator';

@Controller('role')
@UseGuards(JwtAuthGuard, AbilityGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @CheckAbility('manage', 'Role')
  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @CheckAbility('manage', 'Role')
  @Get()
  findAll() {
    return this.roleService.findAll();
  }

  @CheckAbility('manage', 'Role')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roleService.findOne(id);
  }

  @CheckAbility('manage', 'Role')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.roleService.update(id, updateRoleDto);
  }

  @CheckAbility('manage', 'Role')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roleService.remove(id);
  }

  @CheckAbility('manage', 'Role')
  @Post(':id/permissions')
  assignPermission(
    @Param('id') id: string,
    @Body() assignPermissionDto: AssignPermissionDto,
  ) {
    return this.roleService.assignPermission(
      id,
      assignPermissionDto.permissionId,
    );
  }
}