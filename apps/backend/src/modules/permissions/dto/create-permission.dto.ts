import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    example: 'users.read',
    description: 'Código único da permissão',
  })
  @IsString()
  @MinLength(3)
  code!: string;

  @ApiPropertyOptional({
    example: 'Permite consultar usuários',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
