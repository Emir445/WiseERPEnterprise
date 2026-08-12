import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreatePaymentTermDto {
  @ApiProperty({ example: '30/60' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  @Max(60)
  installments!: number;

  @ApiPropertyOptional({ example: 30, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  firstDueDays?: number;

  @ApiPropertyOptional({ example: 30, default: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  intervalDays?: number;
}
