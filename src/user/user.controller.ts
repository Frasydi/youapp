import { Body, Controller, Get, Param, Post, Put, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiSecurity, ApiResponse, ApiUnauthorizedResponse, ApiInternalServerErrorResponse, ApiProduces } from '@nestjs/swagger';
import { UserService } from './user.service';
import { ProfileUpsertDto } from './dto/profileupsert.dto';
import { User } from '../types/customRequest';
import { AuthGuard } from '../app.guard';
import { ProfileDto } from './dto/profile.dto';
import { Response } from 'express';
import * as path from 'path';
import { readFileSync } from 'fs';

@ApiTags("User")
@ApiSecurity("accessToken")
@ApiSecurity("bearer")
@Controller('api/user')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}


  // GET
  @Get('profile')
  @ApiResponse({
    status: 200,
    description: "Successfully retrieved profile",
    example : {
      statusCode : 200,
      data : {
        "display_name": "John Doe",
        "gender": "Male",
        "birthday": "1990-01-01T00:00:00.000Z",
        "horoscope": "Aries",
        "zodiac": "Dragon",
        "height": 180,
        "weight": 75,
        "image_url": "http://example.com/profile.jpg"
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: "Failed to retrieve profile because the user is not authenticated",
    example: {
      statusCode: 401,
      message: "You do not have access"
    }
  })
  async getProfile(@User() user: User) {
    const userId = user.sub;
    return  {statusCode : 200, data : await this.userService.getProfile(userId)};
  }

  @Get('profile/:id')
  @ApiResponse({
    status: 200,
    description: "Successfully retrieved profile by ID",
    example : {
      statusCode : 200,
      data : {
        "display_name": "John Doe",
        "gender": "Male",
        "birthday": "1990-01-01T00:00:00.000Z",
        "horoscope": "Aries",
        "zodiac": "Dragon",
        "height": 180,
        "weight": 75,
        "image_url": "http://example.com/profile.jpg"
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: "Profile not found",
    example: {
      statusCode: 404,
      message: "Profile not found"
    }
  })
  @ApiInternalServerErrorResponse({
    description: "Failed to retrieve profile because of an internal server error",
    example: {
      statusCode: 500,
      message: "Internal Server Error"
    }
  })
  async getProfileById(@Param('id') id: string) {
    return {statusCode : 200, data : await this.userService.getProfile(id)};
  }

  @Get('profile/:id/image')
  @ApiProduces('image/webp')
  @ApiResponse({
    status: 200,
    description: "Successfully retrieved profile image",
  })
  @ApiResponse({
    status: 404,
    description: "Profile image not found",
    example : {
      statusCode: 404,
      message: "Profile image not found"
    }
  })
  @ApiInternalServerErrorResponse({
    description: "Failed to retrieve profile image because of an internal server error",
    example: {
      statusCode: 500,
      message: "Internal Server Error"
    }
  })
  async getProfileImage(@Param('id') id: string, @Res() res: Response) {
    const imagePath = await this.userService.getProfileImage(id);
    res.sendFile(path.join(__dirname,"..","..","uploads",imagePath));
  }



  // POST METHOD
  @Post('profile')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Profile data',
    type : ProfileUpsertDto
  })
  @ApiResponse({
    status: 201,
    description: "Successfully created a profile",
    example : {
      statusCode : 201,
      data : {
        "display_name": "John Doe",
        "gender": "Male",
        "birthday": "1990-01-01T00:00:00.000Z",
        "horoscope": "Aries",
        "zodiac": "Dragon",
        "height": 180,
        "weight": 75,
        "image_url": "http://example.com/profile.jpg"
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: "Failed to create a profile because the user is not authenticated",
    example: {
      statusCode: 401,
      message: "You do not have access"
    }
  })
  @ApiResponse({
    status: 409,
    description: "Failed to create a profile because the profile already exists for this user", 
    example: {
      statusCode: 409,
      message: "Duplicate key error: A profile with this user already exists."
    }
  })
  @ApiUnauthorizedResponse({
    description: "Failed to create a profile because the user is not authenticated",
    example: {
      statusCode: 401,
      message: "You do not have access"
    }
  })
  @ApiInternalServerErrorResponse({
    description: "Failed to create a profile because of an internal server error",
    example: {
      statusCode: 500,
      message: "Error creating profile"
    }
  })
  async createProfile(@Res() res: Response, @User() user: User, @Body() ProfileDto: ProfileUpsertDto, @UploadedFile() file: Express.Multer.File) {
    const userId = user.sub;
    return res.status(201).json({statusCode : 201, data : await this.userService.upsertProfile(userId, ProfileDto, file, "create")})
  }



  //PUT

  @Put('profile/image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Profile image file',
    schema: {
      type: 'object',
      required: ['file'], // Make file required
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated profile image',
    example : "imageurl.webp"
  })
  @ApiResponse({
    status : 401,
    description : "Failed to update profile image because the user is not authenticated",
    example : {
      statusCode: 401,
      message: 'You do not have access',
    }
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    example: {
      statusCode: 404,
      message: 'User not found',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    example: {
      statusCode: 500,
      message: 'Internal Server Error',
    },
  })
  async updateProfileImage(@User() user: any, @UploadedFile() file: Express.Multer.File) {
    const userId = user.sub;
    return await this.userService.updateProfileImage(userId, file);
  }

  

  @Put('profile')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Profile data',
    type : ProfileUpsertDto
  })
  @ApiResponse({
    status: 200,
    description: "Successfully update profile",
    example : {
      statusCode : 200,
      data : {
        "display_name": "John Doe",
        "gender": "Male",
        "birthday": "1990-01-01T00:00:00.000Z",
        "horoscope": "Aries",
        "zodiac": "Dragon",
        "height": 180,
        "weight": 75,
        "image_url": "http://example.com/profile.jpg"
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: "Failed to update a profile because the user is not authenticated",
    example: {
      statusCode: 401,
      message: "You do not have access"
    }
  })
  @ApiResponse({
    status: 404,
    description: "Failed to update a profile because the profile does not exist for this user",
    example: {
      statusCode: 404,
      message: "Profile not found for this user"
    }
  })
  @ApiInternalServerErrorResponse({
    description: "Failed to update a profile because of an internal server error",
    example: {
      statusCode: 500,
      message: "Error updating profile"
    }
  })
  async updateProfile(@User() user: User, @Body() ProfileDto: ProfileUpsertDto, @UploadedFile() file: Express.Multer.File) {
    const userId = user.sub;
    return {statusCode : 200, data : await this.userService.upsertProfile(userId, ProfileDto, file, "update")};
  }

  @Put('interests')
  @ApiBody({
    description: 'Interests data',
    schema: {
      type: 'object',
      properties: {
        interests: {
          type: 'array',
          items: {
            type: 'string',
          },
          example: ['coding', 'music'],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Successfully updated interests",
    example : {
      statusCode : 200,
      data : ["coding", "music"]
    }
      
  })
  @ApiUnauthorizedResponse({
    description: "Failed to update interests because the user is not authenticated",
    example: {
      statusCode: 401,
      message: "You do not have access"
    }
  })
  @ApiInternalServerErrorResponse({
    description: "Failed to update interests because of an internal server error",
    example: {
      statusCode: 500,
      message: "Error updating interests"
    }
  })
  async updateInterests(@User() user: User, @Body('interests') interests: string[]) {
    const userId = user.sub;
    return {statusCode : 200, data : await this.userService.updateInterests(userId, interests)};
  }

  
}
