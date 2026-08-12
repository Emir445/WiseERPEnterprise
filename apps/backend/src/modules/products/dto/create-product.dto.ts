import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ProductUnit {
  UN = 'UN',
  KG = 'KG',
  G = 'G',
  L = 'L',
  ML = 'ML',
  CX = 'CX',
  PC = 'PC',
  M = 'M',
  M2 = 'M2',
  M3 = 'M3',
}

export class CreateProductDto {
  @ApiPropertyOptional({ description: 'Categoria do produto' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ example: 'Água Mineral 500ml' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'AGUA-500ML' })
  @IsString()
  @MinLength(2)
  sku!: string;

  @ApiPropertyOptional({ example: '7891234567890' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({
    enum: ProductUnit,
    example: ProductUnit.UN,
  })
  @IsEnum(ProductUnit)
  unit!: ProductUnit;

  @ApiPropertyOptional({ example: '22011000' })
  @IsOptional()
  @IsString()
  ncm?: string;

  @ApiPropertyOptional({ example: '0300700' })
  @IsOptional()
  @IsString()
  cest?: string;

  @ApiPropertyOptional({ example: '0' })
  @IsOptional()
  @IsString()
  fiscalOrigin?: string;

  @ApiPropertyOptional({ example: 1.25 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({ example: 2.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minimumStock?: number;
}
