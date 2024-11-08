import { IsEnum, IsDate, IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Gender, Horoscope, Zodiac } from '../../schemas/profile.schema';

export class ProfileUpsertDto {
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
    example: '1990-01-01T00:00:00.000Z',
  })
  @IsDate()
  birthday: Date;

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

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Profile image file',
    required : false
  })
  @IsOptional()
  file?: any;
}
