import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) { }

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

  async updateStock(id: number, updateStockDto: UpdateStockDto) {
    // Se define la variable quantity, la definición es como si se escribiera:
    // const quantity = updateStockDto.quantity;
    const { quantity, reason } = updateStockDto;

    //PASO 1. Busqueda(Protección)
    //Se obtiene el producto
    const product = await this.prisma.product.findUnique({ where: { id } });
    //Se verifica que el producto exista 
    if (!product) throw new NotFoundException('Producto no encontrado');

    //PASO 2. Validación de regla de negocio
    //No podemos permitir que el stock sea menor a cero por un ajuste manual
    if (quantity < 0 && product.stock + quantity < 0) {
      throw new BadRequestException('No se puede retirar más de lo que hay disponible')
    }

    //PASO 3. Persistencia (Acción)
    // Se actualiza el stock del producto
    return await this.prisma.$transaction(async (tx) => {
      // A. Actualizamos el stock del producto
      const updatedProduct = await tx.product.update({
        where: { id },
        data: { stock: { increment: quantity } }
      });

      //B. Creamos el registro en el historial
      await tx.inventoryLog.create({
        data: {
          productId: id,
          quantity: quantity,
          type: 'MANUAL_ADJUST',
          reason: reason || 'Ajuste manual de inventario'
        }
      });

      return updatedProduct;
    });
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

  // Historial Global (Los últimos 50 movimientos del inventario)
  async getGlobalInventoryLog(){
    return await this.prisma.inventoryLog.findMany({
      take: 50,
      orderBy: {createdAt: 'desc'},
      include:{
        product:{
          select: { name: true,
                    category: true,
           } //Para saber que producto fue, sin traer todo
        }
      }
    });
  }

  // Historial Especifico (Todos los movimientos de un producto)
  async getProductLogs(productId: number){
    // Primero se verifica que el producto exista
    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    });
    if(!product){
      throw new NotFoundException(`El producto #${productId}, no existe.`)
    }

    return await this.prisma.inventoryLog.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc'},
      include: {
        product: {
          select: { name: true }
        }
      }
    });
  }

  /************************************************************************
   * Nombre: Obtener stock bajo                                           *
   * Descripción: Obtiene los productos que se encuentran a punto         *
   *              de acabarse en el stock de inventario.                  *
   * Autor:  John Andrés Arévalo Rodríguez                                *
   * Fecha:  09-03-2026                                                   *          
   * Rama:   feat/inventory-low-stock-alerts                              *
   * ---------------------------------------------------------------------*
   * Fecha      | Usuario    | Observación                                *
   * ---------------------------------------------------------------------*
   * 09-03-2025 | jaarevalo  | Creación                                   *
   ************************************************************************/
  async getSlowStockAlerts(){
    const products = await this.prisma.product.findMany({
    where: { isActive: true }
  });

  // Filtramos en memoria para comparar campo contra campo fácilmente
  return products.filter(p => p.stock <= p.minStock);
  }
}