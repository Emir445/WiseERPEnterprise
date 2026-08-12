import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class CreateShipmentItemDto {
  @ApiProperty() @IsUUID() salesOrderItemId!: string;
  @ApiProperty({ example: 2 }) @Type(() => Number) @IsNumber() @Min(0.0001) quantity!: number;
}
export class CreateShipmentDto {
  @ApiProperty() @IsUUID() salesOrderId!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() carrierId?: string;
  @ApiProperty({ example: 'EXP-000001' }) @IsString() number!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() trackingCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiProperty({ type: [CreateShipmentItemDto] }) @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => CreateShipmentItemDto) items!: CreateShipmentItemDto[];
}
