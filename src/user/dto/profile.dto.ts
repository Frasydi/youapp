import { IsEnum, IsDate, IsString, IsNumber, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, Horoscope, Zodiac } from '../../schemas/profile.schema';

export class ProfileDto {
  @ApiProperty({
    description: 'Display name of the user',
    example: 'John Doe'
  })
  @IsString()
  @IsNotEmpty()
  display_name: string;

  @ApiProperty({
    description: 'Gender of the user',
    enum: Gender,
    example: Gender.M
  })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({
    description: 'Birthday of the user',
    example: '1990-01-01T00:00:00.000Z'
  })
  @IsDate()
  birthday: Date;

  @ApiPropertyOptional({
    description: 'Horoscope sign of the user',
    enum: Horoscope,
    example: Horoscope.Aries
  })
  @IsEnum(Horoscope)
  @IsOptional()
  horoscope?: Horoscope;

  @ApiPropertyOptional({
    description: 'Zodiac sign of the user',
    enum: Zodiac,
    example: Zodiac.Dragon
  })
  @IsEnum(Zodiac)
  @IsOptional()
  zodiac?: Zodiac;

  @ApiProperty({
    description: 'Height of the user in centimeters',
    example: 180
  })
  @IsNumber()
  height: number;

  @ApiProperty({
    description: 'Weight of the user in kilograms',
    example: 75
  })
  @IsNumber()
  weight: number;

  @ApiPropertyOptional({
    description: 'URL of the user\'s profile image',
    example: 'http://example.com/profile.jpg'
  })
  @IsUrl()
  @IsOptional()
  image_url?: string;
}