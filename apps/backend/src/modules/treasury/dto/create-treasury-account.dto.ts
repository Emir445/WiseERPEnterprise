import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TreasuryAccountType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateTreasuryAccountDto {
  @ApiProperty({ example: 'Banco Principal' }) @IsString() name!: string;
  @ApiProperty({ enum: TreasuryAccountType, example: TreasuryAccountType.BANK }) @IsEnum(TreasuryAccountType) type!: TreasuryAccountType;
  @ApiPropertyOptional() @IsOptional() @IsUUID() branchId?: string;
  @ApiPropertyOptional({ example: 'Banco Exemplo' }) @IsOptional() @IsString() bankName?: string;
  @ApiPropertyOptional({ example: '0001' }) @IsOptional() @IsString() agency?: string;
  @ApiPropertyOptional({ example: '12345-6' }) @IsOptional() @IsString() accountNumber?: string;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) openingBalance?: number;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() allowNegative?: boolean;
}
