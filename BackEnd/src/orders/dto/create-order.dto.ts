import { IsArray, IsInt, IsPositive, ValidateNested, IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

// DTO para cada producto de ntro de la orden
export class OrderItemDto {
    @IsInt()
    @IsPositive()
    productId!: number;

    @IsInt()
    @IsPositive()
    quantity!: number;

    @IsInt() // O IsNumber() dependiendo de cómo lo tengas
    price!: number;

}

// DTO principal de la orden
export class CreateOrderDto {

    @IsInt()
    @IsPositive()
    tableId!: number;

    @IsString()
    @IsOptional()
    alias?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items!: OrderItemDto[]
}
