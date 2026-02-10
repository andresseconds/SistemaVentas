import {IsArray, IsInt, IsPositive, ValidateNested, IsNumber} from 'class-validator';
import {Type} from 'class-transformer';

// DTO para cada producto de ntro de la orden
export class OrderItemDto{
    @IsInt()
    @IsPositive()
    productId: number;
    
    @IsInt()
    @IsPositive()
    quantity: number;

}

// DTO principal de la orden
export class CreateOrderDto {
    @IsInt()
    @IsPositive()
    tableId: number;

    @IsArray()
    @ValidateNested({each:true})
    @Type(() => OrderItemDto)
    items: OrderItemDto[]
}
