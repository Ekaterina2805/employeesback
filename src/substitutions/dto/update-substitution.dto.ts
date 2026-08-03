import { IsOptional, IsBoolean, IsDateString, IsInt, IsPositive } from 'class-validator';

export class UpdateSubstitutionDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  main_employee_id?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  substitute_employee_id?: number;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
