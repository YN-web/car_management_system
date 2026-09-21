import { Body, Controller,  Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionDto } from './dto/assign-permission.dto';

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  findAll() {
    return this.roleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roleService.findOne(id);
  }
//update
    @Patch(':id')
    update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
        ) {
    return this.roleService.update(id, updateRoleDto);
}
//delete
@Delete(':id')
remove(@Param('id') id: string) {
  return this.roleService.remove(id);
}
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