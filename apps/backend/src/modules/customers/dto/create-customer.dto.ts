import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export enum CustomerType {
  INDIVIDUAL = 'INDIVIDUAL',
  BUSINESS = 'BUSINESS',
}

export class CreateCustomerDto {
  @ApiProperty({
    enum: CustomerType,
    example: CustomerType.INDIVIDUAL,
  })
  @IsEnum(CustomerType)
  type!: CustomerType;

  @ApiProperty({
    example: 'João da Silva',
  })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({
    example: 'Empresa Exemplo Ltda',
  })
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiPropertyOptional({
    example: 'Empresa Exemplo',
  })
  @IsOptional()
  @IsString()
  tradeName?: string;

  @ApiProperty({
    example: '12345678901',
    description: 'CPF ou CNPJ sem formatação',
  })
  @IsString()
  document!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stateRegistration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  municipalRegistration?: string;

  @ApiPropertyOptional({
    example: 'cliente@exemplo.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: '1133334444',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: '11999998888',
  })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
