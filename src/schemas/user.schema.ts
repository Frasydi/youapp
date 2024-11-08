import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { IsEmail, IsString, IsNotEmpty, IsArray, MinLength, IsOptional, IsDate } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { Profile, ProfileSchema } from './profile.schema';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {

  @Prop({ required: true, unique : true })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Prop({ required: true, unique : true })
  @IsString()
  @IsNotEmpty()
  username: string;

  @Prop({ required: true })
  @IsArray()
  @IsString({ each: true })
  interest: string[];

  @Prop({ required: true })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @Prop({ type: ProfileSchema })
  @IsOptional()
  profile?: Profile;

  @Prop({ default: Date.now })
  @IsDate()
  lastActive: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Hash the password before saving the user
UserSchema.pre('save', async function (next) {
  const user = this as UserDocument;
  if (user.isModified('password') || user.isNew) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
  next();
});

// Exclude password from responses
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};
