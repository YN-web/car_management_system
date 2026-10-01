import { IsNotEmpty, IsString } from 'class-validator';

export class RejectRepairRequestDto {
  @IsString()
  @IsNotEmpty()
  rejectionReason: string;
}