import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerformanceMetrics } from '../entities/performance-metrics.entity';
import { PerformanceService } from '../services/performance.service';
import { PerformanceController } from '../controllers/performance.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PerformanceMetrics])],
  controllers: [PerformanceController],
  providers: [PerformanceService],
  exports: [PerformanceService],
})
export class PerformanceModule {}
