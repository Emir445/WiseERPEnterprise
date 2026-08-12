import { ApiPropertyOptional } from '@nestjs/swagger';
import { TreasuryMovementType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
export class ListTreasuryMovementsQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() accountId?: string;
  @ApiPropertyOptional({ enum: TreasuryMovementType }) @IsOptional() @IsEnum(TreasuryMovementType) type?: TreasuryMovementType;
  @ApiPropertyOptional() @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() to?: string;
  @ApiPropertyOptional({ default: 1 }) @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @ApiPropertyOptional({ default: 50 }) @Type(() => Number) @IsInt() @Min(1) @Max(200) limit: number = 50;
}
