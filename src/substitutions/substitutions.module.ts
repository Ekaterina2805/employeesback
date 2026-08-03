import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Substitution } from './substitution.model';
import { Employee } from '../employees/employee.model';
import { SubstitutionsController } from './substitutions.controller';
import { SubstitutionsService } from './substitutions.service';

@Module({
  imports: [SequelizeModule.forFeature([Substitution, Employee])],
  controllers: [SubstitutionsController],
  providers: [SubstitutionsService],
  exports: [SubstitutionsService],
})
export class SubstitutionsModule {}
