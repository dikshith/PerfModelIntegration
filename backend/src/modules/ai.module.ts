import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIConfiguration } from '../entities/ai-configuration.entity';
import { AIService } from '../services/ai.service';

@Module({
  imports: [TypeOrmModule.forFeature([AIConfiguration])],
  providers: [AIService],
  exports: [AIService],
})
export class AIModule {}
