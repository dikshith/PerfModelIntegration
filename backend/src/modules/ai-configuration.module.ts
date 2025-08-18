import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIConfiguration } from '../entities/ai-configuration.entity';
import { AIConfigurationService } from '../services/ai-configuration.service';
import { AIConfigurationController } from '../controllers/ai-configuration.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AIConfiguration])],
  controllers: [AIConfigurationController],
  providers: [AIConfigurationService],
  exports: [AIConfigurationService],
})
export class AIConfigurationModule {}
