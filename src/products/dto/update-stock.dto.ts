import {IsNumber, IsString, IsOptional, IsNotEmpty,  } from "class-validator";

export class UpdateStockDto{
    @IsNumber()
    @IsNotEmpty()
    quantity: number;

    @IsString()
    @IsOptional()
    reason?: string;
}