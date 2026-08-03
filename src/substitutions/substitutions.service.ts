import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Substitution } from './substitution.model';
import { Employee } from '../employees/employee.model';
import { CreateSubstitutionDto } from './dto/create-substitution.dto';
import { UpdateSubstitutionDto } from './dto/update-substitution.dto';

@Injectable()
export class SubstitutionsService {
  constructor(
    @InjectModel(Substitution) private readonly model: typeof Substitution,
    @InjectModel(Employee) private readonly empModel: typeof Employee,
  ) {}

  findAll(): Promise<Substitution[]> {
    return this.model.findAll({
      include: [
        { model: Employee, as: 'main_employee' },
        { model: Employee, as: 'substitute_employee' },
      ],
      order: [['start_date', 'DESC']],
    });
  }

  async findOne(id: number): Promise<Substitution> {
    const sub = await this.model.findByPk(id, {
      include: [
        { model: Employee, as: 'main_employee' },
        { model: Employee, as: 'substitute_employee' },
      ],
    });
    if (!sub) throw new NotFoundException(`Замещение #${id} не найдено`);
    return sub;
  }

  async create(dto: CreateSubstitutionDto): Promise<Substitution> {
    const { start_date, end_date, main_employee_id } = dto;

    if (end_date <= start_date) {
      throw new BadRequestException(
        'Дата окончания должна быть позже даты начала',
      );
    }

    await this.checkOverlap(main_employee_id, start_date, end_date);

    return this.model.create({ ...dto } as any);
  }

  async update(id: number, dto: UpdateSubstitutionDto): Promise<Substitution> {
    const sub = await this.findOne(id);

    const startDate = dto.start_date ?? sub.start_date;
    const endDate   = dto.end_date   ?? sub.end_date;
    const mainId    = dto.main_employee_id ?? sub.main_employee_id;

    if (endDate <= startDate) {
      throw new BadRequestException(
        'Дата окончания должна быть позже даты начала',
      );
    }

    // Re-check overlap (excluding this substitution)
    if (dto.start_date || dto.end_date || dto.main_employee_id) {
      await this.checkOverlap(mainId, startDate, endDate, id);
    }

    await sub.update(dto);
    return sub;
  }

  /** Check for active substitution overlaps for the same main_employee */
  private async checkOverlap(
    mainEmployeeId: number,
    startDate: string,
    endDate: string,
    excludeId?: number,
  ) {
    const where: any = {
      main_employee_id: mainEmployeeId,
      is_active: true,
      start_date: { [Op.lte]: endDate },
      end_date:   { [Op.gte]: startDate },
    };
    if (excludeId) where.id = { [Op.ne]: excludeId };

    const conflict = await this.model.findOne({ where });
    if (conflict) {
      const emp = await this.empModel.findByPk(mainEmployeeId);
      throw new ConflictException(
        `У сотрудника ${emp?.full_name_nom ?? '#' + mainEmployeeId} уже есть активное замещение #${conflict.id} ` +
        `(${conflict.start_date} — ${conflict.end_date})`,
      );
    }
  }
}
