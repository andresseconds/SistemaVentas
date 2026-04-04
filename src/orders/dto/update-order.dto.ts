import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { IsEnum, IsOptional} from 'class-validator';

// Definimos los estados posibles para validar
enum OrderStatus{
    PENDING = 'PENDING',
    PREPARING = 'PREPARING',
    DELIVERED = 'DELIVERED',
    PAID = 'PAID',
    CANCELLED = 'CANCELLED',

}

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
    @IsEnum(OrderStatus)
    @IsOptional()
    status?: OrderStatus;
}
