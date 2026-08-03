import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  full_name_nom?: string;

  @IsOptional()
  @IsString()
  full_name_dat?: string;

  @IsOptional()
  @IsString()
  position_nom?: string;

  @IsOptional()
  @IsString()
  position_dat?: string;

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
