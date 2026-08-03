import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { SubstitutionsService } from './substitutions.service';
import { CreateSubstitutionDto } from './dto/create-substitution.dto';
import { UpdateSubstitutionDto } from './dto/update-substitution.dto';

@Controller('substitutions')
export class SubstitutionsController {
  constructor(private readonly service: SubstitutionsService) {}

  /** GET /api/substitutions */
  @Get()
  findAll() {
    return this.service.findAll();
  }

  /** GET /api/substitutions/:id */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  /** POST /api/substitutions */
  @Post()
  create(@Body() dto: CreateSubstitutionDto) {
    return this.service.create(dto);
  }

  /** PATCH /api/substitutions/:id */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubstitutionDto,
  ) {
    return this.service.update(id, dto);
  }
}
