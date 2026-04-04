import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    // Obtener ventas por producto y fecha
    async getSalesByProductAndRange(productId: number, start: string, end: string) {
        // Convertimos los strings a objetos Date de JS
        const startDate = new Date(start);
        const endDate = new Date(end);

        // Aseguramos que el endDate incluya todo el dia (hasta las 23:59:59)
        endDate.setHours(23, 59, 59, 999);

        const sales = await this.prisma.orderItem.aggregate({
            where: {
                productId: productId,
                order: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            },
            _sum: {
                quantity: true,
            },
        });
        return {
            productId,
            startDate,
            endDate,
            totalSold: sales._sum.quantity || 0,
        };
    }

    async getDailySummary() {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // 1. Traemos los items vendidos hoy con su información de producto y receta
        const items = await this.prisma.orderItem.findMany({
            where: {
                order: {
                    createdAt: { gte: startOfDay, lte: endOfDay },
                    status: 'PAID', // Solo que ya entró a caja
                },
            },
            include: {
                product: {
                    include: {
                        recipe: true, // Para calcular el costo
                    },
                },
            },
        });

        // 2. Calculamos los totales
        let totalRevenue = 0;
        let totalCost = 0;

        items.forEach((item) => {
            totalRevenue += item.price * item.quantity;
            // El costo del producto ya lo calculamos antes en el ProductService
            totalCost += (item.product.cost || 0) * item.quantity;
        });

        return {
            date: startOfDay.toISOString().split('T')[0],
            totalOrders: items.length,
            revenue: totalRevenue,
            cost: totalCost,
            netProfit: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0,
        };
    }

    // reports.service.ts

    async getLowStockReport() {
        const alerts = await this.prisma.product.findMany({
            where: {
                OR: [
                    { stock: { lte: 5 } }, // Un valor genérico de alerta, por ahora
                    { stock: { lte: 0 } }  // Agotados
                ],
                isActive: true,
            },
            select: {
                name: true,
                stock: true,
                category: { select: { name: true } }
            }
        });

        return alerts.map(item => ({
            producto: item.name,
            stock: item.stock,
            categoria: item.category.name,
            mensaje: item.stock <= 0 ? "¡AGOTADO!" : "Nivel Crítico"
        }));
    }
}
