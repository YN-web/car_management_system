import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateEnterpriseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}