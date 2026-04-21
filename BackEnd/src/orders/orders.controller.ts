import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get('pending/kitchen')
  findAllPending() {
    return this.ordersService.findAllPending();
  }

  @Get('reports/sales')
  getSalesReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ordersService.getSalesDetail(startDate, endDate);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get('table/:tableId/active')
  findActiveByTable(@Param('tableId') tableId: string) {
    return this.ordersService.findActiveByTable(Number(tableId));
  }

  @Patch('checkout/:id')
  async checkoutOrder(
    @Param('id', ParseIntPipe) orderId: number,
    @Body('payments') payments: { method: string; amount: number }[]
  ) {
    return this.ordersService.checkoutOrder(orderId, payments);
  }

  @Patch('checkout/:tableId')
  async checkoutTable(
    @Param('tableId') tableId: string,
    @Body() body: { payments: { method: string, amount: number }[] } // <-- Ahora es un arreglo
  ) {
    return await this.ordersService.checkoutTable(Number(tableId), body.payments);
  }

  @Patch(':id/add-items')
  addItems(@Param('id') id: string, @Body() body: { items: any[] }) {
    return this.ordersService.addItemsToOrder(Number(id), body.items);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(+id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(+id);
  }
}
