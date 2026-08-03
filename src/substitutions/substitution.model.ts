import {
  Column,
  Model,
  Table,
  DataType,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Employee } from '../employees/employee.model';

@Table({ tableName: 'substitutions', timestamps: true })
export class Substitution extends Model {
  @Column({ primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
  id: number;

  @ForeignKey(() => Employee)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  main_employee_id: number;

  @BelongsTo(() => Employee, 'main_employee_id')
  main_employee: Employee;

  @ForeignKey(() => Employee)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  substitute_employee_id: number;

  @BelongsTo(() => Employee, 'substitute_employee_id')
  substitute_employee: Employee;

  @AllowNull(false)
  @Column(DataType.DATEONLY)
  start_date: string;

  @AllowNull(false)
  @Column(DataType.DATEONLY)
  end_date: string;

  @Default(true)
  @Column(DataType.BOOLEAN)
  is_active: boolean;
}
