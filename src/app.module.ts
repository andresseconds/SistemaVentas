import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { ProductsModule } from './products/products.module';
import { TablesModule } from './tables/tables.module';
import { OrdersModule } from './orders/orders.module';
import { CategoriesModule } from './categories/categories.module';

@Module({
  imports: [ProductsModule, TablesModule, OrdersModule, CategoriesModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
  exports: [PrismaService] //Exportar para que otros módulos lo usen
})
export class AppModule {}
