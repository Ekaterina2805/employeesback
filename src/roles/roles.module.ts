import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Role } from './role.model';
import { Employee } from '../employees/employee.model';
import { Substitution } from '../substitutions/substitution.model';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
  imports: [SequelizeModule.forFeature([Role, Employee, Substitution])],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
