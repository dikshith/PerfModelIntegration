import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationHistory } from '../entities/conversation-history.entity';
import { ChatService } from '../services/chat.service';
import { ChatController } from '../controllers/chat.controller';
import { AIModule } from './ai.module';
import { AIConfigurationModule } from './ai-configuration.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConversationHistory]),
    AIModule,
    AIConfigurationModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
