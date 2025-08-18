import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PerformanceService } from '../services/performance.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async check(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
    environment: string;
  }> {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check with performance metrics' })
  @ApiResponse({ status: 200, description: 'Detailed health information' })
  async detailedCheck(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
    environment: string;
    performance: any;
    memory: NodeJS.MemoryUsage;
  }> {
    const performance = await this.performanceService.getHealthStatus();
    
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      performance,
      memory: process.memoryUsage(),
    };
  }
}
