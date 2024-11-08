import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { UserRegisterDto } from './user/dto/user-register.dto';
import { UserLoginDto } from './user/dto/user-login.dto';
import { User, UserDocument } from './schemas/user.schema';
import { compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { MongoServerError } from 'mongodb';
import { UserDto } from './user/dto/user.dto';
import * as redis from 'redis';
import { RedisClientType } from '@redis/client';
@Injectable()
export class AppService {
  private redisClient: RedisClientType;
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService
  ) {
   this.redisClient = redis.createClient();
   this.redisClient.connect()
  }

  async register(userRegisterDto: UserRegisterDto): Promise<User> {
    const { email, username, password } = userRegisterDto;

    // Create a new user
    const newUser = new this.userModel({
      email,
      username,
      password,
    });

    try {
      return await newUser.save();
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new ConflictException('Duplicate key error: A user with this email or username already exists.');
      }
      throw new InternalServerErrorException('Error registering user');
    }
  }

  async login(userLoginDto: UserLoginDto): Promise<{ accessToken: string, refreshToken: string }> {
    const { usernameEmail, password } = userLoginDto;
    const user = await this.userModel.findOne({
      $or: [{ email: usernameEmail }, { username: usernameEmail }],
    });

    if (user && await compare(password, user.password)) {
      const payload = { username: user.username, sub: user._id };
      const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' }); // Short-lived access token
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' }); // Long-lived refresh token
      return { accessToken, refreshToken };
    } else {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string, refreshToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userModel.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Check if the refresh token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw new UnauthorizedException('Refresh token is blacklisted');
      }

      const newPayload = { username: user.username, sub: user._id };
      const accessToken = this.jwtService.sign(newPayload, { expiresIn: '15m' });
      const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: '7d' });

      // Blacklist the old refresh token
      await this.blacklistToken(refreshToken);

      return { accessToken, refreshToken : newRefreshToken };
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async blacklistToken(token: string): Promise<void> {
    const expiration = this.jwtService.decode(token)['exp'];
    const ttl = expiration - Math.floor(Date.now() / 1000);
    await this.redisClient.setEx(token, ttl, 'blacklisted');
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
        const result = await this.redisClient.get(token);
        return result === 'blacklisted';
    } catch (err) {
        console.log(err)
        throw new InternalServerErrorException('Error checking token blacklist status');
    }
}

 
  async validateUser(userId: string): Promise<UserDto> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async updateUserStatus(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {  lastActive: new Date() });
  }
 
}
