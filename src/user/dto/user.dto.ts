import { IsEmail, IsString, IsNotEmpty, IsArray, MinLength, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProfileDto } from './profile.dto';

export class UserDto {
  @ApiProperty({
    description: 'Email address of the user',
    example: 'user@example.com'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Username of the user',
    example: 'username123'
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Interests of the user',
    example: ['coding', 'music']
  })
  @IsArray()
  @IsString({ each: true })
  interest: string[];

  @ApiPropertyOptional({
    description: 'Profile of the user',
    type: ProfileDto,
    example: {
      display_name: 'John Doe',
      gender: 'M',
      birthday: '1990-01-01T00:00:00.000Z',
      horoscope: 'Aries',
      zodiac: 'Dragon',
      height: 180,
      weight: 75,
      image_url: 'http://example.com/profile.jpg'
    }
  })
  @ValidateNested()
  @Type(() => ProfileDto)
  @IsOptional()
  profile?: ProfileDto;
}