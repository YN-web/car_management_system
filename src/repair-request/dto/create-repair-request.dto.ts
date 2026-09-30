import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateRepairRequestDto {
  @IsUUID()
  vehicleId: string;

  @IsUUID()
  garageId: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}