import { Module } from '@nestjs/common';
import { HealthController } from '../controllers/health.controller';
import { PerformanceModule } from './performance.module';

@Module({
  imports: [PerformanceModule],
  controllers: [HealthController],
})
export class HealthModule {}
