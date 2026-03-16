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
}
