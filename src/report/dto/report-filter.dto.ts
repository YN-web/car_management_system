import { IsDateString, IsOptional } from 'class-validator';

export class ReportFilterDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}