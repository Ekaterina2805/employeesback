import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { join } from 'path';
import { EmployeesModule } from './employees/employees.module';
import { RolesModule } from './roles/roles.module';
import { SubstitutionsModule } from './substitutions/substitutions.module';
import { Employee } from './employees/employee.model';
import { Role } from './roles/role.model';
import { Substitution } from './substitutions/substitution.model';
import { SeedService } from './seed.service';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'sqlite',
      storage: join(__dirname, '..', 'database.sqlite'),
      models: [Employee, Role, Substitution],
      autoLoadModels: true,
      synchronize: true, // auto-creates tables on startup
      logging: false,
    }),
    SequelizeModule.forFeature([Employee, Role, Substitution]),
    EmployeesModule,
    RolesModule,
    SubstitutionsModule,
  ],
  providers: [SeedService],
})
export class AppModule {}
