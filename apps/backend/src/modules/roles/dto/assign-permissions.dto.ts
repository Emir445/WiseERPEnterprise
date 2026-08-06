import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class AssignPermissionsDto {
  @ApiProperty({
    type: [String],
    description: 'IDs das permissões do perfil',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds!: string[];
}
