import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService){}

  async create(createTableDto: CreateTableDto) {
    return await this.prisma.table.create({
      data: createTableDto
    });
  }

  async findAll() {
    return await this.prisma.table.findMany({
      where: {isActive : true}
    });
  }

  async findOne(id: number) {
    const table = await this.prisma.table.findUnique({
      where: {id}
    });

    if (!table) {
      throw new NotFoundException(`Mesa con ID ${id} no encontrada`);
    }
    return table;
  }

  async update(id: number, updateTableDto: UpdateTableDto) {
    // Primero verificamos si la mesa existe
    await this.findOne(id);

    return await this.prisma.table.update({
      where : {id},
      data: updateTableDto,
    });
  }

  remove(id: number) {
    return `This action removes a #${id} table`;
  }
}
