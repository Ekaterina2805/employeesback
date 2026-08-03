import {
  Column,
  Model,
  Table,
  DataType,
  Default,
  AllowNull,
  Unique,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Employee } from '../employees/employee.model';

@Table({ tableName: 'roles', timestamps: true })
export class Role extends Model {
  @Column({ primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
  id: number;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  role_name: string;

  @ForeignKey(() => Employee)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  default_employee_id: number;

  @BelongsTo(() => Employee, 'default_employee_id')
  default_employee: Employee;

  @Default(true)
  @Column(DataType.BOOLEAN)
  is_active: boolean;
}
