import { IsString, IsNotEmpty, IsDate, IsBoolean, IsOptional } from 'class-validator';
import { Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Optional } from '@nestjs/common';

export class ChatDto {
  @ApiProperty({
    description: 'ID of the sender',
    example: '60d0fe4f5311236168a109cb',
    type: Types.ObjectId
  })
  @IsString()
  @IsNotEmpty()
  sender: string;

  @ApiProperty({
    description: 'ID of the receiver',
    example: '60d0fe4f5311236168a109ca',
    type: Types.ObjectId
  })
  @IsString()
  @IsNotEmpty()
  receiver: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Hello, how are you?'
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Image URL',
    example: 'http://example.com/image.png'
  })
  @IsString()
  @IsOptional()
  image: string;

  @ApiProperty({
    description: 'Timestamp of the message',
    example: '2023-10-01T12:34:56Z'
  })
  @IsDate()
  timestamp: Date;

  @ApiProperty({
    description: 'Read status of the message',
    example: false
  })
  @IsBoolean()
  read: boolean;
}