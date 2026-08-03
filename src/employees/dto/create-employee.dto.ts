import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty({ message: 'ФИО (им. п.) обязательно' })
  full_name_nom: string;

  @IsString()
  @IsNotEmpty({ message: 'ФИО (дат. п.) обязательно' })
  full_name_dat: string;

  @IsString()
  @IsNotEmpty({ message: 'Должность (им. п.) обязательна' })
  position_nom: string;

  @IsString()
  @IsNotEmpty({ message: 'Должность (дат. п.) обязательна' })
  position_dat: string;

  @IsOptional()
  @IsString()
  signature?: string;
}
