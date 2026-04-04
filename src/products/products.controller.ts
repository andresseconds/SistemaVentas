import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto'

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  // Para un solo ingrediente
  @Post(':id/recipe')
  addOne(@Param('id', ParseIntPipe) id: number, @Body() data: { ingredientId: number, quantity: number }) {
    return this.productsService.addRecipeItem(id, data.ingredientId, data.quantity);
  }

  // Para la receta completa
  @Post(':id/recipe/bulk')
  addBulk(@Param('id', ParseIntPipe) id: number, @Body() data: { ingredients: { ingredientId: number, quantity: number }[] }) {
    return this.productsService.addFullRecipe(id, data.ingredients);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  // GET /products/inventory/logs (Global)
  @Get('inventory/logs')
  findAllLogs() {
    return this.productsService.getGlobalInventoryLog();
  }

  // GET /products/:id/logs (Específico)
  @Get(':id/logs')
  findProductLogs(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getProductLogs(id);
  }

  // Reporte de rentabilidad
  @Get('reports/profitability')
  getProfitability() {
    return this.productsService.getProfitabilityReport();
  }

  // Reporte de rentabilidadpor producto                 
  @Get(':id/profitability')
  getProductProfitability(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getSingleProductProfitability(id);
  }

  // Alerta de stock bajo                     
  @Get('inventory/alerts')
  getAlerts() {
    return this.productsService.getSlowStockAlerts();
  }

  // Buscar productos por categoria
  @Get('category/:categoryId')
  findByCategory(@Param('categoryId', ParseIntPipe) categoryId: number){
    return this.productsService.findByCategory(categoryId);
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
  ) {
    return this.productsService.updateStock(id, updateStockDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}
