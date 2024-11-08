import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';

export class UserRegisterDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description : "Your Email",
    minLength : 1,
    type : "string",
    example : "test@example.com",
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description : "Your username. The username must be unique from each other",
    minLength : 1,
    example : "testUsername"
  })
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @ApiProperty({
    description : "Your Password (Minimum 8 characters)",
    minLength : 8,
    type : "string",
    example : "password123"
  })
  password: string;
}