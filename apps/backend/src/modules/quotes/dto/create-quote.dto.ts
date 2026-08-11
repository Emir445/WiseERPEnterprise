import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
export class CreateQuoteItemDto {
  @ApiProperty() @IsUUID() productId!: string;
  @ApiProperty({ example: 2 }) @Type(() => Number) @IsNumber() @Min(0.0001) quantity!: number;
  @ApiProperty({ example: 10 }) @Type(() => Number) @IsNumber() @Min(0) unitPrice!: number;
  @ApiPropertyOptional({ example: 0 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) discountAmount?: number;
}
export class CreateQuoteDto {
  @ApiProperty() @IsUUID() branchId!: string;
  @ApiProperty() @IsUUID() customerId!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() paymentTermId?: string;
  @ApiProperty({ example: 'ORC-000001' }) @IsString() number!: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() validUntil?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiProperty({ type: [CreateQuoteItemDto] }) @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => CreateQuoteItemDto) items!: CreateQuoteItemDto[];
}
