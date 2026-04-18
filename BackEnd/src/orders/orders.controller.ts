import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    console.log("2. LLEGÓ AL CONTROLADOR:", createOrderDto);
    return this.ordersService.create(createOrderDto);
  }

  @Get('pending/kitchen')
  findAllPending(){
    return this.ordersService.findAllPending();
  }

  @Get('reports/sales')
  getSalesReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ){
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

  @Patch('checkout/:tableId')
  async checkoutTable(@Param('tableId') tableId: string, @Body('paymentMethod') paymentMethod: string){
    return await this.ordersService.checkoutTable(Number(tableId), paymentMethod);
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
