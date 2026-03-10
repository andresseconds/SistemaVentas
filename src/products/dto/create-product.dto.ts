import { IsString, IsNumber, IsInt,  IsOptional, Min, MinLength } from 'class-validator';

export class CreateProductDto {
    @IsString()
    @MinLength(3)
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsNumber()
    @Min(0)
    stock: number;

    @IsInt()
    @IsOptional()
    @Min(0)
    minStock?: number;

    @IsString()
    category: string;
}
