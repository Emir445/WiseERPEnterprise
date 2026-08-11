import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class SettleFinancialEntryDto {
  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.PIX })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @ApiPropertyOptional({ description: 'Conta bancária/caixa usada na baixa. Opcional para compatibilidade com integrações antigas.' })
  @IsOptional()
  @IsUUID()
  treasuryAccountId?: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID() chartAccountId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() costCenterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
