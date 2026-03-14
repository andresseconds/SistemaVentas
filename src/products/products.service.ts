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


  // Obtener stock bajo                                           
  async getSlowStockAlerts(){
    const products = await this.prisma.product.findMany({
    where: { isActive: true }
  });

  // Filtramos en memoria para comparar campo contra campo fácilmente
  return products.filter(p => p.stock <= p.minStock);
  }

  // Obtener reporte de rentabilidad                             
  async getProfitabilityReport(){
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      select: {
        name: true,
        price: true,
        cost: true,
      }
    });

    return products.map(p => {
      const profit = p.price - p.cost;
      const marginPercentage = p.price > 0 ? (profit / p.price) * 100 : 0;

      return {
        product: p.name,
        price: p.price,
        cost: p.cost,
        profitPerUnit: profit,
        margin: `${marginPercentage.toFixed(2)}%`
      };
    }).sort((a,b) => b.profitPerUnit -  a.profitPerUnit); // Ordenar por los mas rentables
  }

  
  // Obtener reporte de rentabilidad por producto                 
  async getSingleProductProfitability(id: number){
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        name: true,
        price: true,
        cost: true, 
        stock: true 
      }  
    });

    if(!product){
      throw new NotFoundException(`Producto con ID ${id}, no econtrado.`);
    }

    const profit = product.price - product.cost;
    const marginPercentage = product.price > 0 ? (profit / product.price) * 100 : 0;

    //Dato extra: Cuanto dinero hay en stock de este producto
    const totalInventoryValue = product.stock * product.cost;

    return{
      product: product.name,
      metrics: {
        unitPrice: product.price,
        unitCost: product.cost,
        profitPerUnit: profit,
        margin: `${marginPercentage.toFixed(2)}%`,
      },
      inventory:{
        currentStock: product.stock,
        investmentInStock: totalInventoryValue,
        potentialTotalProfit: product.stock * profit //Lo que se ganara cuando se venda ese stock
      }
    };
  }

  // Agregar receta a producto                                    
  // Agrega uno por uno los ingredientes de un producto
  async addRecipeItem(productId: number, ingredientId: number, quantity: number){
    const item = await this.prisma.recipeItem.upsert({ 
      where: {productId_ingredientId: { productId, ingredientId}},
      update: { quantity },
      create: { productId, ingredientId, quantity}
    });

    // Actualiza el costo del producto padre
    await this.updateProductConstFromRecipe(productId);

    return item;
  }

  // Agrega todos los ingredientes de un producto
  async addFullRecipe(productId: number, ingredients: { ingredientId: number, quantity: number}[]){
    await this.prisma.$transaction(async (tx) => {
      for(const item of ingredients){
        await tx.recipeItem.upsert({
          where: { productId_ingredientId: { productId, ingredientId: item.ingredientId }},
          update: { quantity: item.quantity },
          create: { productId, ingredientId: item.ingredientId, quantity: item.quantity }
        });
      }
    });

    return await this.updateProductConstFromRecipe(productId);
  }


  async updateProductConstFromRecipe(productId: number){
    // 1. Buscamos el producto con todos sus ingredientes y el costo de cada uno
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        recipe:{
          include:{
            ingredient: true //Para obetener el cost del insumo
          }
        }
      }
    });

    if(!product || product.recipe.length === 0 ) return; 

    //2. Calculamos la suma de (cantidad_usada * costo_del_ingrediente)
    const totalCost = product.recipe.reduce((acc, item) => {
      return acc + (item.quantity * item.ingredient.cost);
    }, 0);

    // 3. Actualizamos el costo  del producto principal
    return await this.prisma.product.update({
      where: { id: productId },
      data: { cost: totalCost}
    });
  }

  // Buscar productos por categoria
  async findByCategory(categoryId: number){
    return await this.prisma.product.findMany({
      where: {
        categoryId: categoryId,
        isActive: true  // Solo busca los productos activos
      },
      include:{
        category: true //Para mostrar el nombre de la categoria en la respuesta
      },
    });
  }
}