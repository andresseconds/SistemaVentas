import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    return await this.prisma.product.create({
      data: createProductDto,
    });
  }

  async findAll() {
    return await this.prisma.product.findMany({
      where: { isActive: true },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    // Primero verificamos si existe
    await this.findOne(id);

    return await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async updateStock(id: number, updateStockDto: UpdateStockDto){
    // Se define la variable quantity, la definición es como si se escribiera:
    // const quantity = updateStockDto.quantity;
   const { quantity } = updateStockDto;
   
   //PASO 1. Busqueda(Protección)
   //Se obtiene el producto
   const product = await this.prisma.product.findUnique({where: { id }});
   if(!product) throw new NotFoundException('Producto no encontrado');
   
   //PASO 2. Validación de regla de negocio
   //No podemos permitir que el stock sea menor a cero por un ajuste manual
   if(quantity < 0 && product.stock + quantity < 0){
    throw new BadRequestException('No se puede retirar más de lo que hay disponible')
   }

   //PASO 3. Persistencia (Acción)
   // Se actualiza el stock 
   return await this.prisma.product.update({
    where: { id },
    data: {
      stock:{
        increment: quantity
      }
    }
   })
  }

  async remove(id: number) {
    // Primero verificamos si existe
    await this.findOne(id);

    // En lugar de borrarlo físicamente, lo desactivamos (Soft Delete)
    // Esto es más profesional para no perder historial de ventas
    return await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }
}