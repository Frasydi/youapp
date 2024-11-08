import { ObjectId } from 'mongodb';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Chat, ChatDocument } from '../schemas/chat.schema';
import handleFile from '../utils/createFile';
import deleteFile from '../utils/deleteFile';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {}

  async createMessage(senderId: string, receiverId: string, content: string, image?: Express.Multer.File): Promise<Chat> {
    if (!isValidObjectId(senderId) || !isValidObjectId(receiverId)) throw new BadRequestException("userId is not valid");
    const sender = await this.userModel.findById(senderId);
    const receiver = await this.userModel.findById(receiverId);

    if(sender == null) throw new NotFoundException("Sender not found");
    if(receiver == null) throw new NotFoundException("Receiver not found");

    const newMessage = new this.chatModel({
      sender: senderId,
      receiver: receiverId,
      message: content,
      timestamp: new Date(),
    });

    if(image != null) {
      newMessage.image = await handleFile(image, "chat");
    }

    return await newMessage.save();
  }

  async getMessages(userId: string, otherUserId: string): Promise<Chat[]> {
    if (!isValidObjectId(userId) || !isValidObjectId(otherUserId)) throw new BadRequestException("userId is not valid");
    
    await this.chatModel.updateMany({
      $or: [
        { sender: new ObjectId(userId), receiver: new ObjectId(otherUserId) },
        { sender: new ObjectId(otherUserId), receiver: new ObjectId(userId) },
      ],
      is_deleted: false,
      read : false
    }, {
      $set : {read : true}
    }).exec();

    return await this.chatModel.find({
      $or: [
        { sender: new ObjectId(userId), receiver: new ObjectId(otherUserId) },
        { sender: new ObjectId(otherUserId), receiver: new ObjectId(userId) },
      ],
      is_deleted: false
    }).sort({ timestamp: 1 }).exec();

  }

  async editMessage(messageId: string, content: string, image?: Express.Multer.File): Promise<Chat> {
    if (!isValidObjectId(messageId) ) throw new BadRequestException("messageId is not valid");

    const message = await this.chatModel.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');
    message.message = content;

    if(image != null) {
      deleteFile(message.image, "chat")
      message.image = await handleFile(image, "chat");
    }

    return await message.save();
  }

  async deleteMessage(messageId: string): Promise<Chat> {
    if (!isValidObjectId(messageId)) throw new BadRequestException("messageId is not valid");

    const message = await this.chatModel.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');
    if(message.is_deleted) throw new NotFoundException('Message Not Found');
    message.is_deleted = true;
    return await message.save();

  }
  

  async getChatUsers(userId: string): Promise<{ user: User, lastMessage: Chat }[]> {
    if (!isValidObjectId(userId)) throw new BadRequestException("userId is not valid");
    const chatUsers = await this.chatModel.aggregate([
      {
        $match: {
          $or: [
            { sender: new ObjectId(userId) },
            { receiver: new ObjectId(userId) },
          ],
          is_deleted: false
        },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", userId] },
              "$receiver",
              "$sender",
            ],
          },
          lastMessage: { $last: "$$ROOT" }
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: "$userDetails"
      },
      {
        $project: {
          _id: 0,
          user: {
            _id: "$userDetails._id",
            email: "$userDetails.email",
            username: "$userDetails.username",
            interest: "$userDetails.interest",
            profile: "$userDetails.profile",
            lastActive: "$userDetails.lastActive"
          },
          lastMessage: 1
        }
      }
    ]);

    return chatUsers;
  }
}