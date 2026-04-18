import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) { }

  async create(createTableDto: CreateTableDto) {
    return await this.prisma.table.create({
      data: {
        ...createTableDto,
        number: createTableDto.number!,
        status: createTableDto.status as any,
      }
    });
  }

  findAll() {
    return this.prisma.table.findMany({
      include: {
        // Traemos la orden activa para poder leer su alias en el frontend
        orders: {
          where: { status: { not: 'PAID' } },
        }
      },
      orderBy: { id: 'asc' } // Opcional: para que siempre salgan en orden
    });
  }

  async findOne(id: number) {
    const table = await this.prisma.table.findUnique({
      where: { id }
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
      where: { id },
      data: updateTableDto,
    });
  }

  async remove(id: number) {
    // Verificamos que exista antes de desactivarla
    await this.findOne(id);

    return await this.prisma.table.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findOccupied() {
    return await this.prisma.table.findMany({
      where: {
        status: 'OCCUPIED',
        isActive: true,
      }
    });
  }
}
