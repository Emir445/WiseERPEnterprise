import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCarrierDto {
  @ApiProperty({ example: 'Transportadora Exemplo' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: '12345678000190' })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({ example: 'logistica@exemplo.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '1133334444' })
  @IsOptional()
  @IsString()
  phone?: string;
}
