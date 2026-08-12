import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateProductCategoryDto {
  @ApiProperty({ example: 'Bebidas' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: 'Produtos da linha de bebidas' })
  @IsOptional()
  @IsString()
  description?: string;
}
