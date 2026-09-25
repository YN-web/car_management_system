import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  name: string;

  @IsBoolean()
  @IsOptional()
  isSuperAdmin?: boolean;
}

