import { IsString, IsNotEmpty, IsInt, IsPositive } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty({ message: 'Название роли обязательно' })
  role_name: string;

  @IsInt()
  @IsPositive()
  default_employee_id: number;
}
