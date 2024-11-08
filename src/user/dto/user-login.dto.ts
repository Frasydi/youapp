import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, ValidateIf, IsEmail, MinLength } from 'class-validator';

export class UserLoginDto {
  
  @ValidateIf(o => o.usernameEmail.includes('@'))
  @IsEmail()
  @ValidateIf(o => !o.usernameEmail.includes('@'))
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description :"Your Username or Email",
    examples : ["userTest", "test@example.com"],
    minLength : 1,
    example : "test@example.com"
  })
  usernameEmail: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: "Your Password", minLength: 8, example: "password123" })
  @MinLength(8)
  password: string;
}
