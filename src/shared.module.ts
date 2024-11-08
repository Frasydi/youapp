// shared.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Profile, ProfileSchema } from './schemas/profile.schema';
import { AppService } from './app.service';
import { Chat, ChatSchema } from './schemas/chat.schema';
import { ChatService } from './chat/chat.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Profile.name, schema: ProfileSchema },
      { name : Chat.name, schema : ChatSchema}
    ]),
  ],
  //AppService in SharedModule because it contains a function that used by AuthGuard 
  providers : [AppService, ChatService],
  exports: [MongooseModule, AppService, ChatService],
})
export class SharedModule {}