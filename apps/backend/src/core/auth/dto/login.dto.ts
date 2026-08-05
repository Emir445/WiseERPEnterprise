import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'admin@cerradusgelo.local',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'WiseERP@123',
  })
  @IsString()
  @MinLength(8)
  password!: string;
}