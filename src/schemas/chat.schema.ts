import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { IsString, IsNotEmpty, IsArray, IsDate, IsBoolean, IsOptional } from 'class-validator';
import { User } from './user.schema';

export type ChatDocument = HydratedDocument<Chat>;

@Schema()
export class Chat {

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  @IsNotEmpty()
  sender: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  @IsNotEmpty()
  receiver: Types.ObjectId;

  @Prop({ required: true })
  @IsString()
  @IsNotEmpty()
  message: string;

  @Prop()
  @IsString()
  @IsOptional()
  image: string;

  @Prop({ default: Date.now })
  @IsDate()
  timestamp: Date;

  @Prop({ default: false })
  @IsBoolean()
  read: boolean;

  @Prop({ default: false })
  @IsBoolean()
  is_deleted: boolean;

}

export const ChatSchema = SchemaFactory.createForClass(Chat);