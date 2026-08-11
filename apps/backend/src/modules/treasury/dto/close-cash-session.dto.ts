import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
export class CloseCashSessionDto {
  @ApiProperty({ example: 500 }) @Type(() => Number) @IsNumber() @Min(0) actualClosingAmount!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
