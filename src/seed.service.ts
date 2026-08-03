import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Employee } from './employees/employee.model';
import { Role } from './roles/role.model';
import { Substitution } from './substitutions/substitution.model';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectModel(Employee) private empModel: typeof Employee,
    @InjectModel(Role) private roleModel: typeof Role,
    @InjectModel(Substitution) private subModel: typeof Substitution,
  ) {}

  async onApplicationBootstrap() {
    const count = await this.empModel.count();
    if (count > 0) return; // already seeded

    // Employees
    const [ivan, maria, aleksey, elena] = await this.empModel.bulkCreate([
      {
        full_name_nom: 'Иванов Иван Иванович',
        full_name_dat: 'Иванову Ивану Ивановичу',
        position_nom: 'Генеральный директор',
        position_dat: 'Генеральному директору',
        signature: null,
        is_active: true,
      },
      {
        full_name_nom: 'Петрова Мария Сергеевна',
        full_name_dat: 'Петровой Марии Сергеевне',
        position_nom: 'Финансовый директор',
        position_dat: 'Финансовому директору',
        signature: null,
        is_active: true,
      },
      {
        full_name_nom: 'Сидоров Алексей Николаевич',
        full_name_dat: 'Сидорову Алексею Николаевичу',
        position_nom: 'Главный бухгалтер',
        position_dat: 'Главному бухгалтеру',
        signature: null,
        is_active: true,
      },
      {
        full_name_nom: 'Козлова Елена Дмитриевна',
        full_name_dat: 'Козловой Елене Дмитриевне',
        position_nom: 'Руководитель HR',
        position_dat: 'Руководителю HR',
        signature: null,
        is_active: true,
      },
      {
        full_name_nom: 'Новиков Дмитрий Павлович',
        full_name_dat: 'Новикову Дмитрию Павловичу',
        position_nom: 'Юрисконсульт',
        position_dat: 'Юрисконсульту',
        signature: null,
        is_active: false,
      },
    ]);

    // Roles
    await this.roleModel.bulkCreate([
      { role_name: 'Генеральный директор', default_employee_id: ivan.id, is_active: true },
      { role_name: 'Финансовый директор',  default_employee_id: maria.id, is_active: true },
      { role_name: 'Главный бухгалтер',    default_employee_id: aleksey.id, is_active: true },
    ]);

    // Substitutions
    await this.subModel.bulkCreate([
      {
        main_employee_id: ivan.id,
        substitute_employee_id: maria.id,
        start_date: '2026-06-01',
        end_date: '2026-06-30',
        is_active: true,
      },
      {
        main_employee_id: aleksey.id,
        substitute_employee_id: elena.id,
        start_date: '2026-05-01',
        end_date: '2026-05-15',
        is_active: false,
      },
    ]);

    console.log('✓ Database seeded with test data');
  }
}
