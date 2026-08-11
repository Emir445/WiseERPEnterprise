import { ApiProperty } from '@nestjs/swagger';
import { ChartAccountNature } from '@prisma/client';
import { IsEnum, IsString, MinLength } from 'class-validator';

export class CreateChartAccountDto {
  @ApiProperty({ example: '3.01.01' })
  @IsString()
  @MinLength(1)
  code!: string;

  @ApiProperty({ example: 'Receita de vendas' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ enum: ChartAccountNature, example: ChartAccountNature.REVENUE })
  @IsEnum(ChartAccountNature)
  nature!: ChartAccountNature;
}
