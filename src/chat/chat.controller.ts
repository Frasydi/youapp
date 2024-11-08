import { Controller, Post, Body, UseGuards, Get, Param, Req, Patch, Delete, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody, ApiResponse, ApiUnauthorizedResponse, ApiInternalServerErrorResponse, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { AuthGuard } from '../app.guard';
import { SendChatDTO } from './dto/sendChat.dto';
import { User } from '../types/customRequest';
import { ChatDto } from './dto/chat.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @Post('sendMessage')
  @ApiBody({ type: SendChatDTO })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
    example: {
      statusCode: 201,
      message: 'Message sent successfully',
      data: {
        "_id": "672dad6c42d843ba894484fc",
        "sender": "672b158095429e9e9cf991a2",
        "receiver": "672a3b74b5b9659261f25c9e",
        "message": "Hello World 2",
        "read": false,
        "is_deleted": false,
        "timestamp": "2024-11-08T06:19:24.414Z",
        "__v": 0
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    example: {
      statusCode: 401,
      message: 'You do not have access',
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    example: {
      statusCode: 500,
      message: 'Internal Server Error',
    },
  })
  async sendMessage(@Res() res: Response, @Body() sendChatDTO: SendChatDTO, @User() user: User, @UploadedFile() file: Express.Multer.File) {
    const senderId = user.sub;
    const newMessage = await this.chatService.createMessage(senderId, sendChatDTO.receiverId, sendChatDTO.message, file);
    return res.status(201).send({ statusCode: 201, message: 'Message sent successfully', data: newMessage });
  }

  @Get('messages/:userId')
  @ApiParam({ name: 'userId', required: true, description: 'ID of the other user' })
  @ApiResponse({
    status: 200,
    description: 'Messages retrieved successfully',
    example: {
      statusCode: 200,
      data: [
        {
          "_id": "672dad6c42d843ba894484fc",
          "sender": "672b158095429e9e9cf991a2",
          "receiver": "672a3b74b5b9659261f25c9e",
          "message": "Hello World 2",
          "read": false,
          "is_deleted": false,
          "timestamp": "2024-11-08T06:19:24.414Z",
          "__v": 0
        }
      ]
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    example: {
      statusCode: 401,
      message: 'You do not have access',
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    example: {
      statusCode: 500,
      message: 'Internal Server Error',
    },
  })
  async getMessages(@Param('userId') otherUserId: string, @User() user: User) {
    const userId = user.sub;
    const messages = await this.chatService.getMessages(userId, otherUserId);
    return { statusCode: 200, data: messages };
  }

  @Get('list-chat')
  @ApiResponse({
    status: 200,
    description: 'List of users the current user has chatted with along with their last messages',
    example: {
      statusCode: 200, data:
        [
          {
            "lastMessage": {
              "_id": "672dad6c42d843ba894484fc",
              "sender": "672b158095429e9e9cf991a2",
              "receiver": "672a3b74b5b9659261f25c9e",
              "message": "Hello World 2",
              "read": false,
              "is_deleted": false,
              "timestamp": "2024-11-08T06:19:24.414Z",
              "__v": 0
            },
            "user": {
              "_id": "672b158095429e9e9cf991a2",
              "email": "test5@example.com",
              "username": "testUsername5",
              "interest": [
                "coding",
                "music"
              ],
              "profile": {
                "display_name": "Updated User",
                "gender": "Male",
                "birthday": "1990-01-01T00:00:00.000Z",
                "horoscope": "Capricorn",
                "zodiac": "Dog",
                "height": 180,
                "weight": 75,
                "image_url": "facebook.webp",
                "_id": "672b15d995429e9e9cf991a7"
              },
              "lastActive": "2024-11-08T07:46:35.055Z"
            }
          }
        ]
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    example: {
      statusCode: 401,
      message: 'You do not have access',
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    example: {
      statusCode: 500,
      message: 'Internal Server Error',
    },
  })
  async getChatUsers(@User() user: User) {
    const userId = user.sub;
    const chatUsersWithLastMessages = await this.chatService.getChatUsers(userId);
    return { statusCode: 200, data: chatUsersWithLastMessages };
  }

  @Patch('editMessage/:messageId')
  @ApiBody({ type: SendChatDTO })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'messageId', required: true, description: 'ID of the message to edit' })
  @ApiResponse({
    status: 200,
    description: 'Message edited successfully',
    example: {
      statusCode: 200,
      data: {
        "_id": "672dad6c42d843ba894484fc",
        "sender": "672b158095429e9e9cf991a2",
        "receiver": "672a3b74b5b9659261f25c9e",
        "message": "Hello World 2",
        "read": false,
        "is_deleted": false,
        "timestamp": "2024-11-08T06:19:24.414Z",
        "__v": 0
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    example: {
      statusCode: 401,
      message: 'You do not have access',
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    example: {
      statusCode: 500,
      message: 'Internal Server Error',
    },
  })
  async editMessage(@Param('messageId') messageId: string, @Body() sendChatDTO: SendChatDTO, @UploadedFile() file: Express.Multer.File) {
    const updatedMessage = await this.chatService.editMessage(messageId, sendChatDTO.message, file);
    return { statusCode: 200, data: updatedMessage };
  }

  @Delete('deleteMessage/:messageId')
  @ApiParam({ name: 'messageId', required: true, description: 'ID of the message to delete' })
  @ApiResponse({
    status: 200,
    description: 'Message deleted successfully',
    example: {
      statusCode: 200,
      message: 'Message deleted successfully',
      data: {
        "_id": "672dad6c42d843ba894484fc",
        "sender": "672b158095429e9e9cf991a2",
        "receiver": "672a3b74b5b9659261f25c9e",
        "message": "Hello World 2",
        "read": false,
        "is_deleted": false,
        "timestamp": "2024-11-08T06:19:24.414Z",
        "__v": 0
      }
    },

  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    example: {
      statusCode: 401,
      message: 'You do not have access',
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    example: {
      statusCode: 500,
      message: 'Internal Server Error',
    },
  })
  async deleteMessage(@Param('messageId') messageId: string) {
    const deleteMessage = await this.chatService.deleteMessage(messageId);
    return { message: 'Message deleted successfully', data: deleteMessage };
  }


}
