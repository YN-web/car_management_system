
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateExpenseDto {
  @IsUUID()
  vehicleId: string;

  @ValidateIf((o) => !o.categoryName)
  @IsUUID()
  categoryId?: string;

  @ValidateIf((o) => !o.categoryId)
  @IsString()
  @IsOptional()
  categoryName?: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}
