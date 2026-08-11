import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ example: 'Filial Centro' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'CENTRO' })
  @IsString()
  @MinLength(2)
  code!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({ example: 'centro@empresa.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '1133334444' })
  @IsOptional()
  @IsString()
  phone?: string;
}
