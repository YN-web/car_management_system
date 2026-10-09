
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';

import { UserService } from './user.service';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { AbilityGuard } from '../casl/ability/ability.guard';
import { CheckAbility } from '../casl/ability/ability.decorator';

import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) {}

  @UseGuards(JwtAuthGuard, AbilityGuard)
  @CheckAbility('create', 'User')
  @Post()
  create(
    @Body() createUserDto: CreateUserDto,
    @Req() req: any,
  ) {
    return this.userService.create(
      createUserDto,
      req.user.id,
    );
  }

  // SUPER_ADMIN RECOVERY
  @Post('recover-super-admin')
  recoverSuperAdmin(
    @Body()
    body: {
      name: string;
      email: string;
      password: string;
      enterpriseId: string;
      recoverySecret: string;
    },
  ) {
    return this.userService.recoverSuperAdmin(
      body,
    );
  }

  @UseGuards(JwtAuthGuard, AbilityGuard)
  @CheckAbility('read', 'User')
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @UseGuards(JwtAuthGuard, AbilityGuard)
  @CheckAbility('read', 'User')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, AbilityGuard)
  @CheckAbility('update', 'User')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: any,
  ) {
    return this.userService.update(
      id,
      updateUserDto,
      req.user.id,
    );
  }

  @UseGuards(JwtAuthGuard, AbilityGuard)
  @CheckAbility('update', 'User')
  @Patch(':id/deactivate')
  deactivate(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.userService.deactivate(
      id,
      req.user.id,
    );
  }
}
