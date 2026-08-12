import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
export class CreateCostCenterDto {
  @ApiProperty({ example: 'ADM' }) @IsString() @MinLength(1) code!: string;
  @ApiProperty({ example: 'Administrativo' }) @IsString() @MinLength(2) name!: string;
}
