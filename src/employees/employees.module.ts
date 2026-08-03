import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Employee } from './employee.model';
import { Role } from '../roles/role.model';
import { Substitution } from '../substitutions/substitution.model';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';

@Module({
  imports: [SequelizeModule.forFeature([Employee, Role, Substitution])],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
