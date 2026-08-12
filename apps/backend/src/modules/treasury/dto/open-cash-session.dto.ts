import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
export class OpenCashSessionDto {
  @ApiProperty() @IsUUID() branchId!: string;
  @ApiProperty() @IsUUID() treasuryAccountId!: string;
  @ApiProperty({ example: 100 }) @Type(() => Number) @IsNumber() @Min(0) openingAmount!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
