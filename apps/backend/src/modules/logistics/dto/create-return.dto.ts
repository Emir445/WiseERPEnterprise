import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class CreateCustomerReturnItemDto {
  @ApiProperty() @IsUUID() productId!: string;
  @ApiProperty({ example: 1 }) @Type(() => Number) @IsNumber() @Min(0.0001) quantity!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() restock?: boolean;
}
export class CreateCustomerReturnDto {
  @ApiProperty() @IsUUID() saleId!: string;
  @ApiProperty({ example: 'DEV-000001' }) @IsString() number!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiProperty({ type: [CreateCustomerReturnItemDto] }) @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => CreateCustomerReturnItemDto) items!: CreateCustomerReturnItemDto[];
}
