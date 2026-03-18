import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaService } from 'src/prisma.service';
import { OrdersGateway } from './orders.gateway';


@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService, OrdersGateway],
  exports: [OrdersService, OrdersGateway], // Para que otros módulos puedan usarlo
})
export class OrdersModule {}
