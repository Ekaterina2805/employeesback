import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  /** GET /api/employees?is_active=true */
  @Get()
  findAll(@Query('is_active') isActive?: string) {
    const filter =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.service.findAll(filter);
  }

  /** GET /api/employees/:id */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  /** POST /api/employees */
  @Post()
  create(@Body() dto: CreateEmployeeDto) {
    return this.service.create(dto);
  }

  /** PATCH /api/employees/:id */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.service.update(id, dto);
  }
}
