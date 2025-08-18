import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetPerformanceReportDto {
  @ApiPropertyOptional({ description: 'Start date for the report' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for the report' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Endpoint to filter by' })
  @IsOptional()
  @IsString()
  endpoint?: string;

  @ApiPropertyOptional({ description: 'HTTP method to filter by' })
  @IsOptional()
  @IsString()
  method?: string;
}

export class PerformanceTimeSeriesPoint {
  @ApiProperty({ description: 'Time bucket (ISO string)' })
  time: string;

  @ApiProperty({ description: 'Number of requests in the bucket' })
  requests: number;

  @ApiProperty({ description: 'Average response time in the bucket' })
  avgResponseTime: number;

  @ApiProperty({ description: 'Error rate (%) in the bucket' })
  errorRate: number;

  @ApiProperty({ description: 'Success rate (%) in the bucket' })
  successRate: number;
}

export class EndpointStat {
  @ApiProperty({ description: 'HTTP method + endpoint key' })
  key: string;

  @ApiProperty({ description: 'Total requests' })
  count: number;

  @ApiProperty({ description: 'Average response time' })
  averageResponseTime: number;

  @ApiProperty({ description: 'Success rate (%)' })
  successRate: number;

  @ApiProperty({ description: 'Error count' })
  errors: number;
}

export class PerformanceReportDto {
  @ApiProperty({ description: 'Total requests' })
  totalRequests: number;

  @ApiProperty({ description: 'Average response time in milliseconds' })
  averageResponseTime: number;

  @ApiProperty({ description: 'Minimum response time in milliseconds' })
  minResponseTime: number;

  @ApiProperty({ description: 'Maximum response time in milliseconds' })
  maxResponseTime: number;

  @ApiProperty({ description: 'p50 response time in milliseconds' })
  p50: number;

  @ApiProperty({ description: 'p90 response time in milliseconds' })
  p90: number;

  @ApiProperty({ description: 'p99 response time in milliseconds' })
  p99: number;

  @ApiProperty({ description: 'Success rate percentage' })
  successRate: number;

  @ApiProperty({ description: 'Error rate percentage' })
  errorRate: number;

  @ApiProperty({ description: 'Approximate uptime percentage across time buckets' })
  uptime: number;

  @ApiProperty({ description: 'Requests per endpoint' })
  endpointStats: Record<string, any>;

  @ApiProperty({ description: 'Top slow endpoints' })
  topSlowEndpoints: EndpointStat[];

  @ApiProperty({ description: 'Top error-prone endpoints' })
  topErrorEndpoints: EndpointStat[];

  @ApiProperty({ description: 'Response time distribution' })
  responseTimeDistribution: Record<string, number>;

  @ApiProperty({ description: 'Status code distribution' })
  statusCodeDistribution: Record<string, number>;

  @ApiProperty({ description: 'Method distribution' })
  methodDistribution: Record<string, number>;

  @ApiProperty({ description: 'Time series for charts', type: [PerformanceTimeSeriesPoint] })
  timeSeries: PerformanceTimeSeriesPoint[];

  @ApiProperty({ description: 'Detected anomalies (timestamps or bucket keys)', required: false })
  anomalies?: string[];
}
