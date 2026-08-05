import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListUsersQueryDto {

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

}
