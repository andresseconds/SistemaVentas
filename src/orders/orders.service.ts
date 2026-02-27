import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) { }

  async create(createOrderDto: CreateOrderDto) {
    const { tableId, items } = createOrderDto;

    // 1. Validar que la mesa existe y está activa
    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!table || !table.isActive) {
      throw new NotFoundException(`La mesa con ID ${tableId} no existe o está inactiva.`);
    }

    if (table.status === 'OCCUPIED') {
      throw new BadRequestException(`La mesa ${tableId} ya esta ocupada. Debes cerrar la orden anterior para poder crear una nueva.`)
    }

    // 2. Iniciar transacción
    return await this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsData: { productId: number; quantity: number; price: number }[] = [];

      // 3. Procesar cada producto para obtener su precio actual
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product || !product.isActive) {
          throw new NotFoundException(`Producto con ID ${item.productId} no encontrado`);
        }

        // Validar si hay suficiente stock
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Stock induficiente para ${product.name}. Disponibles: ${product.stock}, Solicitados: ${item.quantity}`);
        }

        // Restar el stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity // Prisma hace la resta automaticamente
            }
          }
        });

        const subtotal = product.price * item.quantity;
        totalAmount += subtotal;

        // Preparamos los datos del detalle
        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price, // Guardamos el precio del momento
        });
      }

      // 4. Crear la orden y sus detalles
      const order = await tx.order.create({
        data: {
          tableId: table.id,
          total: totalAmount,
          status: 'PENDING',
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true, // Para que la respuesta incluya los productos
        }
      });

      //. 5 Actualizar el estado de la mesa a OCUPADA
      await tx.table.update({
        where: { id: table.id },
        data: { status: 'OCCUPIED' },
      });

      return order;
    });
  }

  findAll() {
    return `This action returns all orders`;
  }

  async findAllPending() {
    return await this.prisma.order.findMany({
      where: {
        status: {
          in: ['PENDING', 'PREPARING'] //Solo lo que esta en la cola 
        },
        isActive: true
      },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, category: true } // Solo lo que la cocina necesita
            }
          }
        },
        table: {
          select: { number: true, description: true }
        }
      },
      orderBy: { createdAt: 'asc' } // La mas antigua primero (FIFO)
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  async update(id: number, updateOrderDto: UpdateOrderDto) {
    const { status, tableId, ...otherData } = updateOrderDto;

    // 1. Verificar si la orden existe e incluir la mesa
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true} //Incluye los elementos de la orden
    });

    if (!order) {
      throw new NotFoundException(`Orden con ID ${id} no encontrada`);
    }

    // 2. Iniciar transacción para asegurar consistencia
    return await this.prisma.$transaction(async (tx) => {
      // Lógica de STOCK
      // Solo devolvemos stock si pasa a CANCELLED y no estaba cancelada antes
      if(status === 'CANCELLED' && order.status !== 'CANCELLED'){
        for(const item of order.items){
          await tx.product.update({
            where: { id: item.productId },
            data: { 
              stock: { 
                increment: item.quantity
              }
            },
          });
        }
      }

      // 3. Si el nuevo estado es 'PAID' o 'CANCELLED', liberar mesa
      if (status === 'PAID' || status === 'CANCELLED') {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: 'AVAILABLE' },
        });
      }else if (status === 'PREPARING' || status === 'DELIVERED') {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: 'OCCUPIED' },
        });
      }

      // 4. Actualizar la orden y retornar
      return await tx.order.update({
        where: { id },
        data: { status },
      });
    });
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }

  async getSalesDetail(startDate?: string, endDate?: string) {
    //1. Lógica para definir rango
    // Si no mandan fecha, por defecto es hoy
    const start = startDate ? new Date(`${startDate}T00:00:00-05:00`): new Date();
    const end = endDate ? new Date(`${endDate}T23:59:59-05:00`): new Date();
    const today = new Date();
    

    // Valida que la fecha inicial no sea mayor a la fecha fin 
    if(start > end){
      throw new BadRequestException('La fecha de inicio no puede ser posterior a la fecha de fin');
    }else if(end > today){
      throw new BadRequestException('La fecha final no puede ser superior a hoy');
    }

    // Ajuste de horas para cubrir el dia completo
    start.setHours(0, 0, 0, 0) // Inicio del día
    end.setHours(23,59,59,999);

    //2. Consulta a prisma con rango
    const sales = await this.prisma.order.findMany({
      where: {
        status: 'PAID',
        createdAt: { 
          gte: start,
          lte: end,
         },
      },
      include: {
        table: true //Incluye la tabla "table" y trae todo lo que hay en ella
      }
    });

    const stats = sales.reduce((acc, order) => {
      acc.totalMoney += order.total; 
      acc.totalOrders += 1;
      return acc;
    }, { totalMoney: 0, totalOrders: 0 });

    // Se calcula el promedio
    const averageTicket = stats.totalOrders > 0
      ? stats.totalMoney / stats.totalOrders : 0;


    //const totalEarnings = sales.reduce((sum, order) => sum + order.total, 0);

    const salesByTable = sales.reduce((acc, order) => {
      const tableName = order.table.number; // Sacamos el nombre (gracias al include
      const currentTotal = order.total;     // Lo que gasto en esta orden

      // Si la mesa aun no esta en nuestra lista, la anotamos con 0
      if (!acc[tableName]) {
        acc[tableName] = 0;
      }

      // Sumamos el gasto de esta orden al total que ya llevaba la mesa
      acc[tableName] += currentTotal;

      return acc;
    }, {} as Record<string, number>);

    let topTable = { name: 'Ninguna', total: 0 };

    for (const name in salesByTable) {
      if (salesByTable[name] > topTable.total) {
        topTable = { name: name, total: salesByTable[name] }
      }
    }

    return {
      startDate: start,
      endDate: end,
      count: stats.totalOrders, // Usamos el dato del reduce
      total: stats.totalMoney,  // Usamos el dato del reduce
      averageTicket: Number(averageTicket.toFixed(2)), // Deja máximo dos decimales
      bestSellingTable: topTable,   // Lo que ya tenías
      currency: 'COP'
    };
  }

}
