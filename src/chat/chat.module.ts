import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { SharedModule } from '../shared.module';
import { ChatGateway } from './chat.gateway';

@Module({
  imports : [SharedModule],
  controllers: [ChatController],
  providers: [ChatGateway]
})
export class ChatModule {}
