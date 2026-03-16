import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService){}

    @Get('product/:productId')
    getSalesRange(
        @Param('productId', ParseIntPipe) productId: number,
        @Query('start') start: string,
        @Query('end') end: string
    ){
        return this.reportsService.getSalesByProductAndRange(productId, start, end);
    }
}
