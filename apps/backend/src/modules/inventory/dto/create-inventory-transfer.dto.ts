import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class InventoryTransferItemDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  quantity!: number;
}

export class CreateInventoryTransferDto {
  @ApiProperty({ example: 'TRF-000001' })
  @IsString()
  number!: string;

  @ApiProperty()
  @IsUUID()
  fromBranchId!: string;

  @ApiProperty()
  @IsUUID()
  toBranchId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [InventoryTransferItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InventoryTransferItemDto)
  items!: InventoryTransferItemDto[];
}
