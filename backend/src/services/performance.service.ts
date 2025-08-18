import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { PerformanceMetrics } from '../entities/performance-metrics.entity';
import { GetPerformanceReportDto, PerformanceReportDto, PerformanceTimeSeriesPoint, EndpointStat } from '../dto/performance.dto';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectRepository(PerformanceMetrics)
    private readonly performanceRepository: Repository<PerformanceMetrics>,
  ) {}

  async recordMetrics(
    endpoint: string,
    method: string,
    responseTime: number,
    statusCode: number,
    additionalData?: any,
  ): Promise<void> {
    const metrics = this.performanceRepository.create({
      endpoint,
      method,
      responseTime,
      statusCode,
      userAgent: additionalData?.userAgent,
      clientIp: additionalData?.clientIp,
      requestBody: additionalData?.requestBody,
      responseBody: additionalData?.responseBody,
      errorMessage: additionalData?.errorMessage,
      metrics: additionalData?.additionalMetrics,
      metadata: additionalData?.metadata,
      tags: additionalData?.tags,
    });

    await this.performanceRepository.save(metrics);
  }

  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
  }

  private buildTimeSeries(metrics: PerformanceMetrics[], bucketMs: number): PerformanceTimeSeriesPoint[] {
    const buckets = new Map<string, { count: number; sum: number; errors: number; successes: number }>();
    for (const m of metrics) {
      const t = new Date(m.createdAt);
      const bucketKey = new Date(Math.floor(t.getTime() / bucketMs) * bucketMs).toISOString();
      const b = buckets.get(bucketKey) || { count: 0, sum: 0, errors: 0, successes: 0 };
      b.count += 1;
      b.sum += m.responseTime;
      if (m.statusCode >= 400) b.errors += 1; else b.successes += 1;
      buckets.set(bucketKey, b);
    }
    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([time, b]) => ({
        time,
        requests: b.count,
        avgResponseTime: b.count ? Math.round(b.sum / b.count) : 0,
        errorRate: b.count ? Math.round((b.errors / b.count) * 10000) / 100 : 0,
        successRate: b.count ? Math.round((b.successes / b.count) * 10000) / 100 : 0,
      }));
  }

  private buildEndpointStats(metrics: PerformanceMetrics[]): Record<string, any> {
    const stats: Record<string, { count: number; sum: number; success: number; errors: number }> = {};
    for (const m of metrics) {
      const key = `${m.method} ${m.endpoint}`;
      if (!stats[key]) stats[key] = { count: 0, sum: 0, success: 0, errors: 0 };
      stats[key].count += 1;
      stats[key].sum += m.responseTime;
      if (m.statusCode >= 200 && m.statusCode < 400) stats[key].success += 1; else stats[key].errors += 1;
    }
    const result: Record<string, any> = {};
    for (const key of Object.keys(stats)) {
      const s = stats[key];
      result[key] = {
        count: s.count,
        averageResponseTime: Math.round(s.sum / s.count),
        successRate: Math.round((s.success / s.count) * 10000) / 100,
        errors: s.errors,
      };
    }
    return result;
  }

  async generateReport(filters: GetPerformanceReportDto): Promise<PerformanceReportDto> {
    const { startDate, endDate, endpoint, method } = filters;

    const conditions: any = {};
    if (startDate || endDate) {
      conditions.createdAt = Between(
        startDate ? new Date(startDate) : new Date(0),
        endDate ? new Date(endDate) : new Date(),
      );
    }
    if (endpoint) conditions.endpoint = endpoint;
    if (method) conditions.method = method;

    const metrics = await this.performanceRepository.find({
      where: conditions,
      order: { createdAt: 'DESC' },
      take: 5000,
    });

    const totalRequests = metrics.length;
    const responseTimes = metrics.map((m) => m.responseTime).sort((a, b) => a - b);
    const avg = totalRequests ? responseTimes.reduce((a, b) => a + b, 0) / totalRequests : 0;
    const min = totalRequests ? responseTimes[0] : 0;
    const max = totalRequests ? responseTimes[responseTimes.length - 1] : 0;
    const p50 = this.percentile(responseTimes, 50);
    const p90 = this.percentile(responseTimes, 90);
    const p99 = this.percentile(responseTimes, 99);

    const successes = metrics.filter((m) => m.statusCode >= 200 && m.statusCode < 400).length;
    const successRate = totalRequests ? (successes / totalRequests) * 100 : 0;
    const errorRate = 100 - successRate;

    const endpointStats = this.buildEndpointStats(metrics);

    // Top lists
    const topSlowEndpoints: EndpointStat[] = Object.entries(endpointStats)
      .map(([key, v]: any) => ({ key, ...v }))
      .sort((a, b) => b.averageResponseTime - a.averageResponseTime)
      .slice(0, 5);

    const topErrorEndpoints: EndpointStat[] = Object.entries(endpointStats)
      .map(([key, v]: any) => ({ key, ...v }))
      .sort((a, b) => b.errors - a.errors)
      .slice(0, 5);

    // Distributions
    const responseTimeDistribution = {
      '0-100ms': metrics.filter((m) => m.responseTime <= 100).length,
      '100-500ms': metrics.filter((m) => m.responseTime > 100 && m.responseTime <= 500).length,
      '500ms-1s': metrics.filter((m) => m.responseTime > 500 && m.responseTime <= 1000).length,
      '1s-3s': metrics.filter((m) => m.responseTime > 1000 && m.responseTime <= 3000).length,
      '3s-5s': metrics.filter((m) => m.responseTime > 3000 && m.responseTime <= 5000).length,
      '5s+': metrics.filter((m) => m.responseTime > 5000).length,
    } as Record<string, number>;

    const statusCodeDistribution: Record<string, number> = {};
    for (const m of metrics) {
      const code = m.statusCode.toString();
      statusCodeDistribution[code] = (statusCodeDistribution[code] || 0) + 1;
    }

    const methodDistribution: Record<string, number> = {};
    for (const m of metrics) {
      methodDistribution[m.method] = (methodDistribution[m.method] || 0) + 1;
    }

    // Time series (hourly buckets by default)
    const timeSeries = this.buildTimeSeries(metrics, 60 * 60 * 1000);

    // Uptime approximation: percent of buckets with successRate > 0 and no total outage
    const uptime = timeSeries.length
      ? Math.round((timeSeries.filter((b) => b.requests > 0 && b.successRate > 0).length / timeSeries.length) * 10000) / 100
      : 100;

    // Simple anomaly detection: mark buckets where errorRate spikes > 3x median errorRate
    const errorRates = timeSeries.map((b) => b.errorRate).sort((a, b) => a - b);
    const medianError = this.percentile(errorRates, 50) || 0;
    const anomalies = timeSeries
      .filter((b) => medianError > 0 ? b.errorRate > medianError * 3 : b.errorRate > 10)
      .map((b) => b.time);

    return {
      totalRequests,
      averageResponseTime: Math.round(avg),
      minResponseTime: min || 0,
      maxResponseTime: max || 0,
      p50: Math.round(p50 || 0),
      p90: Math.round(p90 || 0),
      p99: Math.round(p99 || 0),
      successRate: Math.round(successRate * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      uptime,
      endpointStats,
      topSlowEndpoints,
      topErrorEndpoints,
      responseTimeDistribution,
      statusCodeDistribution,
      methodDistribution,
      timeSeries,
      anomalies,
    } as PerformanceReportDto;
  }

  async getMetrics(filters: GetPerformanceReportDto): Promise<PerformanceMetrics[]> {
    const { startDate, endDate, endpoint, method } = filters;

    const conditions: any = {};
    if (startDate || endDate) {
      conditions.createdAt = Between(
        startDate ? new Date(startDate) : new Date(0),
        endDate ? new Date(endDate) : new Date(),
      );
    }
    if (endpoint) conditions.endpoint = endpoint;
    if (method) conditions.method = method;

    return await this.performanceRepository.find({
      where: conditions,
      order: { createdAt: 'DESC' },
      take: 10000,
    });
  }

  async deleteOldMetrics(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.performanceRepository.delete({
      createdAt: Between(new Date(0), cutoffDate),
    });

    return result.affected || 0;
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    averageResponseTime: number;
    errorRate: number;
    totalRequests: number;
  }> {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const recentMetrics = await this.performanceRepository.find({
      where: { createdAt: Between(oneHourAgo, new Date()) },
    });

    const totalRequests = recentMetrics.length;
    const errors = recentMetrics.filter((m) => m.statusCode >= 400).length;
    const errorRate = totalRequests > 0 ? (errors / totalRequests) * 100 : 0;
    const averageResponseTime = totalRequests > 0
      ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests
      : 0;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (errorRate > 10 || averageResponseTime > 5000) status = 'critical';
    else if (errorRate > 5 || averageResponseTime > 2000) status = 'warning';

    return {
      status,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      totalRequests,
    };
  }
}
