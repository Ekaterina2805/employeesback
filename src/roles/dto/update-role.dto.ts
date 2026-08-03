import { IsString, IsOptional, IsBoolean, IsInt, IsPositive } from 'class-validator';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  role_name?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  default_employee_id?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
