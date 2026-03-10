import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto'

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  // GET /products/inventory/logs (Global)
  @Get('inventory/logs')
  findAllLogs(){
    return this.productsService.getGlobalInventoryLog();
  }

  // GET /products/:id/logs (Específico)
  @Get(':id/logs')
  findProductLogs(@Param('id',ParseIntPipe) id: number){
    return this.productsService.getProductLogs(id);
  }

  /****************************************************
   * Nombre: Alerta de stock bajo                     *
   * Descripción: EndPoint para el consumo del API    *
   * Autor:  John Andrés Arévalo Rodríguez            *
   * Fecha:  09-03-2026                               *          
   * Rama:   feat/inventory-low-stock-alerts          *
   * ------------------------------------------------ *
   * Fecha      | Usuario    | Observación            *
   * ------------------------------------------------ *
   * 09-03-2025 | jaarevalo  | Creación               *
   ****************************************************/
  @Get('inventory/alerts')
  getAlerts(){
    return this.productsService.getSlowStockAlerts();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(+id, updateProductDto);
  }

  @Patch(':id/stock')
  updateStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStockDto: UpdateStockDto
  ){
    return this.productsService.updateStock(id, updateStockDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}
