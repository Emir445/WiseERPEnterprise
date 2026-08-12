import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FinancialEntryType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateFinancialEntryDto {
  @ApiProperty() @IsUUID() branchId!: string;
  @ApiProperty({ enum: FinancialEntryType }) @IsEnum(FinancialEntryType) type!: FinancialEntryType;
  @ApiProperty({ example: 'Despesa administrativa' }) @IsString() description!: string;
  @ApiProperty({ example: 250 }) @Type(() => Number) @IsNumber() @Min(0.01) amount!: number;
  @ApiProperty({ example: '2026-08-30' }) @IsDateString() dueDate!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() supplierId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() chartAccountId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() costCenterId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
