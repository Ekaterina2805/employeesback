import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly service: RolesService) {}

  /** GET /api/roles */
  @Get()
  findAll() {
    return this.service.findAll();
  }

  /** GET /api/roles/resolve/:roleName — must be before :id */
  @Get('resolve/:roleName')
  resolveRole(@Param('roleName') roleName: string) {
    return this.service.resolveRole(roleName);
  }

  /** GET /api/roles/:id */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  /** POST /api/roles */
  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.service.create(dto);
  }

  /** PATCH /api/roles/:id */
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
    return this.service.update(id, dto);
  }
}
