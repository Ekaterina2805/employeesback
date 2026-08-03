import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Role } from './role.model';
import { Employee } from '../employees/employee.model';
import { Substitution } from '../substitutions/substitution.model';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role) private readonly model: typeof Role,
    @InjectModel(Employee) private readonly empModel: typeof Employee,
    @InjectModel(Substitution) private readonly subModel: typeof Substitution,
  ) {}

  findAll(): Promise<Role[]> {
    return this.model.findAll({
      include: [{ model: Employee, as: 'default_employee' }],
      order: [['role_name', 'ASC']],
    });
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.model.findByPk(id, {
      include: [{ model: Employee, as: 'default_employee' }],
    });
    if (!role) throw new NotFoundException(`Роль #${id} не найдена`);
    return role;
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    const existing = await this.model.findOne({
      where: {
        role_name: { [Op.like]: dto.role_name },
      },
    });
    if (existing) {
      throw new ConflictException(`Роль «${dto.role_name}» уже существует`);
    }
    return this.model.create({ ...dto } as any);
  }

  async update(id: number, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    if (dto.role_name && dto.role_name !== role.role_name) {
      const dup = await this.model.findOne({
        where: {
          role_name: { [Op.like]: dto.role_name },
          id: { [Op.ne]: id },
        },
      });
      if (dup) {
        throw new ConflictException(`Роль «${dto.role_name}» уже существует`);
      }
    }

    await role.update(dto);
    return role;
  }

  /** Resolve which employee should sign/appear for a given role name today */
  async resolveRole(roleName: string): Promise<{
    employee: Employee;
    isSubstitute: boolean;
    substitutionId?: number;
  }> {
    const role = await this.model.findOne({
      where: { role_name: roleName, is_active: true },
    });
    if (!role) throw new NotFoundException(`Роль «${roleName}» не найдена`);

    const today = new Date().toISOString().slice(0, 10);

    const activeSub = await this.subModel.findOne({
      where: {
        main_employee_id: role.default_employee_id,
        is_active: true,
        start_date: { [Op.lte]: today },
        end_date: { [Op.gte]: today },
      },
    });

    if (activeSub) {
      const substitute = await this.empModel.findByPk(
        activeSub.substitute_employee_id,
      );
      return { employee: substitute, isSubstitute: true, substitutionId: activeSub.id };
    }

    const defaultEmployee = await this.empModel.findByPk(
      role.default_employee_id,
    );
    return { employee: defaultEmployee, isSubstitute: false };
  }
}
