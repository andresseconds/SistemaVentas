import { IsString, IsNumber, Min, IsOptional, IsEnum } from 'class-validator';

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

    @IsEnum(TableStatus)
    @IsOptional()
    status?: string;
}
