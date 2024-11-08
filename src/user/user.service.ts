import { MongoServerError, ObjectId } from 'mongodb';
import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UserRegisterDto } from './dto/user-register.dto';
import { ProfileUpsertDto } from './dto/profileupsert.dto';
import { User, UserDocument } from '../schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import handleFile from '../utils/createFile';
import { Profile } from '../schemas/profile.schema';
import deleteFile from '../utils/deleteFile';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {}

  async upsertProfile(userId: string, profileDto: ProfileUpsertDto, file: Express.Multer.File, type: "create" | "update"): Promise<Profile> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    console.log(userId)
    if (type === "create" && user.profile) {
      throw new ConflictException('Profile already exists for this user');
    } else if(type === "update" && user.profile == null) {
      throw new NotFoundException('Profile not found for this user');
    }

    user.profile = { ...user.profile, ...profileDto };

    if (file) {
      if(type === "update") deleteFile(user?.profile?.image_url || "", "profile");
      user.profile.image_url = await handleFile(file, "profile");
    }

    try {
      await user.save();
      return user.profile;
    } catch (error) {
      console.log(error)
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new ConflictException('Duplicate key error: A profile with this user already exists.');
      }
      throw new InternalServerErrorException('Error updating profile');
    }
  }

  async updateInterests(userId: string, interests: string[]): Promise<string[]> {
    try {
      const user = await this.userModel.findById(userId); // Assume this method exists
      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.interest = interests;
      await user.save(); // Assume this method exists to save the user

      return user.interest;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Error updating interests');
    }
  }

  async getProfile(userId: string): Promise<Profile> {
    if(!isValidObjectId(userId)) throw new BadRequestException("Invalid user id");
    const user = await this.userModel.findById(userId).populate('profile');
    if (!user || !user.profile) {
      throw new NotFoundException('Profile not found for this user');
    }
    return user.profile;
  }
  
  async getProfileImage(userId: string): Promise<string> {
    if(!isValidObjectId(userId)) throw new BadRequestException("Invalid user id");
    const user = await this.userModel.findById(userId).populate('profile');
    if (!user || !user.profile || !user.profile.image_url) {
      throw new NotFoundException('Profile image not found for this user');
    }
    return user.profile.image_url;
  }

  async updateProfileImage(userId: string, file: Express.Multer.File): Promise<string> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    if (user.profile && user.profile?.image_url) {
      deleteFile(user.profile?.image_url, "profile");
    }
    if(user.profile == null) {
      //@ts-ignore
      user.profile = {}
    }

    user.profile.image_url = await handleFile(file, "profile");

    try {
      await user.save();
      return user.profile.image_url;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Error updating profile image');
    }
  }
}
