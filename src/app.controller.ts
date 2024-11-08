import { Body, Controller, Get, Post, Res, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { AppService } from './app.service';
import { UserRegisterDto } from './user/dto/user-register.dto';
import { UserLoginDto } from './user/dto/user-login.dto';
import { Response, Request } from 'express';
import { User } from './types/customRequest';
import { AuthGuard } from './app.guard';
import { ApiBody, ApiHeader, ApiInternalServerErrorResponse, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { UserDto } from './user/dto/user.dto';

@ApiTags("common")
@ApiSecurity("accessToken")
@ApiSecurity("bearer")
@Controller("/api")
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Post('register')
  @ApiResponse({
    status: 201,
    description: "Successfully created an account",
    type: UserDto,
  })
  @ApiResponse({
    status: 409,
    description: "Failed to create an account because the username or email is already in use",
    example: {
      statusCode: 409,
      message: "Duplicate key error: A user with this email or username already exists."
    }
  })
  @ApiResponse({
    status: 500,
    description: "Failed to create an account because of an internal server error",
    example: {
      statusCode: 500,
      message: "Error creating user"
    }
  })
  async register(@Body() userRegisterDto: UserRegisterDto, @Res() res: Response) {
    return res.status(201).send(await this.appService.register(userRegisterDto));
  }

  @ApiBody({ type: UserLoginDto })
  @Post('login')
  @ApiResponse({ 
    status: 200, 
    description: "Success Login!", 
    example : {
      accessToken : "testtoken",
      refreshToken: "refreshtoken"
    }
  })
  @ApiResponse({
    status : 401,
    description : "Failed to login because of invalid credentials",
    example : {
      statusCode : 401,
      message : "Invalid credentials"
    }
  })
  @ApiInternalServerErrorResponse({
    description : "Failed to login because of an internal server error",
    example : {
      statusCode : 500,
      message : "Internal Server Error"
    }
  })
  async login(@Body() userLoginDto: UserLoginDto, @Res() res: Response) {
    const { accessToken, refreshToken } = await this.appService.login(userLoginDto);
    res.cookie('accessToken', accessToken, { httpOnly: true, secure: true }); // Ensure secure flag is set
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true }); // Ensure secure flag is set
    return res.status(200).send({ accessToken, refreshToken });
  }

  @Post('refresh-token')
  @ApiHeader({
    name: 'x-refresh-token',
    description: 'Refresh token',
    required: false
  })
  @ApiResponse({
    status: 200,
    description: "Successfully refreshed token",
    example: {
      accessToken: "newAccessToken",
      refreshToken: "newRefreshToken"
    }
  })
  @ApiResponse({
    status: 401,
    description: "Failed to refresh token because the refresh token is invalid or expired",
    example: {
      statusCode: 401,
      message: "Invalid or expired refresh token"
    }
  })
  @ApiInternalServerErrorResponse({
    description: "Failed to refresh token because of an internal server error",
    example: {
      statusCode: 500,
      message: "Internal Server Error"
    }
  })
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    const refreshToken : string | null = req.cookies?.refreshToken || req.headers?.['x-refresh-token'];
    if (refreshToken == null) {
      throw new UnauthorizedException("Refresh token not found");
    }
    const { accessToken, refreshToken : newRefreshToken } = await this.appService.refreshToken(refreshToken);
    res.cookie('accessToken', accessToken, { httpOnly: true, secure: true });
    res.cookie('refreshToken', newRefreshToken, { httpOnly: true, secure: true });
    return res.status(200).send({ accessToken, refreshToken: newRefreshToken });
  }

  @Get('auth')
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 200,
    description: "Successfully authenticated",
    type: UserDto
  })
  @ApiResponse({
    status: 401,
    description: "Failed to authenticate because the user is not found",
    examples : {
      "Token is invalid" : {
        summary : "If token is invalid",
        value : {
          statusCode : 401,
          message : "You do not have access"
        }
      },
      "user not found" :  {
        summary : "If user is not found",
        value : {
          statusCode : 401,
          message : "User not found"
        }
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description : "Failed to authenticate because of an internal server error",
    example : {
      statusCode : 500,
      message : "Internal Server Error"
    }
  })
  async getAuth(@User() user : User) {
    return await this.appService.validateUser(user.sub);
  }
}
