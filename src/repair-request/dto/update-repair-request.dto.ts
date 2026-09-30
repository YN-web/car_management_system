import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateRepairRequestDto {
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @IsOptional()
  @IsUUID()
  garageId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;
}