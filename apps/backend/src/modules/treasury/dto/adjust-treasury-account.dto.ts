import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
export class AdjustTreasuryAccountDto {
  @ApiProperty({ example: 250 }) @Type(() => Number) @IsNumber() @Min(0) newBalance!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
