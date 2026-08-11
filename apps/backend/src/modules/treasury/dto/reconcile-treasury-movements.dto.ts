import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsOptional, IsString, IsUUID } from 'class-validator';
export class ReconcileTreasuryMovementsDto {
  @ApiProperty({ type: [String] }) @IsArray() @ArrayMinSize(1) @IsUUID('4', { each: true }) movementIds!: string[];
  @ApiPropertyOptional({ example: 'OFX-2026-08' }) @IsOptional() @IsString() reference?: string;
}
