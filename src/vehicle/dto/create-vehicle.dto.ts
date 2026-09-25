import { IsInt, IsOptional, IsString, Min } from 'class-validator';

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
  status?: string;

  @IsOptional()
  @IsString()
  driverId?: string;
}