import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Employee } from './employee.model';
import { Role } from '../roles/role.model';
import { Substitution } from '../substitutions/substitution.model';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectModel(Employee) private readonly model: typeof Employee,
    @InjectModel(Role) private readonly roleModel: typeof Role,
    @InjectModel(Substitution) private readonly subModel: typeof Substitution,
  ) {}

  findAll(isActive?: boolean): Promise<Employee[]> {
    const where: any = {};
    if (isActive !== undefined) where.is_active = isActive;
    return this.model.findAll({ where, order: [['full_name_nom', 'ASC']] });
  }

  async findOne(id: number): Promise<Employee> {
    const emp = await this.model.findByPk(id);
    if (!emp) throw new NotFoundException(`Сотрудник #${id} не найден`);
    return emp;
  }

  create(dto: CreateEmployeeDto): Promise<Employee> {
    return this.model.create({ ...dto } as any);
  }

  async update(id: number, dto: UpdateEmployeeDto): Promise<Employee> {
    const emp = await this.findOne(id);

    // Business rule: block deactivation if employee is in use
    if (dto.is_active === false && emp.is_active === true) {
      const conflicts: string[] = [];

      const usedInRole = await this.roleModel.findAll({
        where: { default_employee_id: id, is_active: true },
      });
      usedInRole.forEach((r) =>
        conflicts.push(`Роль «${r.role_name}» — сотрудник по умолчанию`),
      );

      const usedInSub = await this.subModel.findAll({
        where: { is_active: true },
      });
      usedInSub
        .filter(
          (s) => s.main_employee_id === id || s.substitute_employee_id === id,
        )
        .forEach((s) => {
          const role =
            s.main_employee_id === id ? 'основной сотрудник' : 'заместитель';
          conflicts.push(`Замещение #${s.id} — ${role}`);
        });

      if (conflicts.length > 0) {
        throw new ConflictException({
          message: 'Нельзя деактивировать сотрудника',
          employeeName: emp.full_name_nom,
          conflicts,
        });
      }
    }

    await emp.update(dto);
    return emp;
  }
}
