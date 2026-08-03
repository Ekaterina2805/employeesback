import {
  Column,
  Model,
  Table,
  DataType,
  Default,
  AllowNull,
  HasMany,
} from 'sequelize-typescript';
import { Role } from '../roles/role.model';
import { Substitution } from '../substitutions/substitution.model';

@Table({ tableName: 'employees', timestamps: true })
export class Employee extends Model {
  @Column({ primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
  id: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  full_name_nom: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  full_name_dat: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  position_nom: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  position_dat: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  signature: string | null;

  @Default(true)
  @Column(DataType.BOOLEAN)
  is_active: boolean;

  @HasMany(() => Role, 'default_employee_id')
  roles: Role[];

  @HasMany(() => Substitution, 'main_employee_id')
  main_substitutions: Substitution[];

  @HasMany(() => Substitution, 'substitute_employee_id')
  sub_substitutions: Substitution[];
}
