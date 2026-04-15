import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaService } from '../prisma.service';
import { OrdersGateway } from './orders.gateway';


@Module({
  providers: [OrdersService, PrismaService, OrdersGateway],
  controllers: [OrdersController],
  exports: [OrdersService, OrdersGateway], // Para que otros módulos puedan usarlo
})
export class OrdersModule {}
