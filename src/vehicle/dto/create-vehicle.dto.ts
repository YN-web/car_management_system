import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsIn,
  Min,
} from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  plateNumber: string;

  @IsString()
  brand: string;

  @IsString()
  model: string;

  @IsInt()
  @Min(1900)
  year: number;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'in_repair', 'retired'])
  status?: string;

  @IsOptional()
  @IsString()
  driverId?: string;

  @IsUUID()
  enterpriseId: string;
}