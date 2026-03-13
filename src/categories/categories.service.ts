import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(name: string) {
    return await this.prisma.category.create({
      data: { name: name.toUpperCase() }, // Las guardamos en mayúsculas para consistencia
    });
  }

  async findAll() {
    return await this.prisma.category.findMany({
      include: {
        _count: { select: { products: true } }, // Nos dice cuántos productos hay en cada categoría
      },
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { products: true },
    });
    if (!category) throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    return category;
  }

  async remove(id: number) {
    const category = await this.findOne(id);
    
    // Validación de seguridad
    if (category.products.length > 0) {
      throw new BadRequestException('No se puede eliminar una categoría que tiene productos asociados.');
    }

    return await this.prisma.category.delete({ where: { id } });
  }
}
