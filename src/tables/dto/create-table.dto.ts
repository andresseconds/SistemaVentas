import { IsString, IsNumber, Min, IsOptional, IsEnum, IsBoolean } from 'class-validator';

// Definimos los estados posibles para evitar errores de escritura
export enum TableStatus {
    AVAILABLE = 'AVAILABLE',
    OCCUPIED = 'OCCUPIED',
    RESERVED = 'RESERVED'
}
export class CreateTableDto {
    @IsString()
    number: string;

    @IsNumber()
    @Min(1)
    @IsOptional()
    capacity?: number;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(TableStatus)
    @IsOptional()
    status?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
