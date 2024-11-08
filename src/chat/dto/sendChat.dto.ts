import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Optional } from '@nestjs/common';

export class SendChatDTO {
  @ApiProperty({
    description: 'ID of the receiver',
    example: '60d0fe4f5311236168a109ca'
  })
  @IsString()
  @IsNotEmpty()
  receiverId: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Hello, how are you?'
  })
  @IsString()
  @IsNotEmpty()
  message: string;

}