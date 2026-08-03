import { IsInt, IsPositive, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateSubstitutionDto {
  @IsInt()
  @IsPositive()
  main_employee_id: number;

  @IsInt()
  @IsPositive()
  substitute_employee_id: number;

  @IsDateString()
  @IsNotEmpty()
  start_date: string;

  @IsDateString()
  @IsNotEmpty()
  end_date: string;
}
