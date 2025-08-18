import {
  Controller,
  Get,
  Query,
  ValidationPipe,
  Body,
  Param,
  Post,
  Logger,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Response } from 'express';
import { PerformanceService } from '../services/performance.service';
import { GetPerformanceReportDto, PerformanceReportDto } from '../dto/performance.dto';
import { PerformanceMetrics } from '../entities/performance-metrics.entity';

@ApiTags('Performance Reports')
@Controller('reports')
export class PerformanceController {
  private readonly logger = new Logger(PerformanceController.name);
  private reports: any[] = [];

  constructor(private readonly performanceService: PerformanceService) {}

  @Get('performance')
  @ApiOperation({ summary: 'Get performance report' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO string)' })
  @ApiQuery({ name: 'endpoint', required: false, description: 'Filter by endpoint' })
  @ApiQuery({ name: 'method', required: false, description: 'Filter by HTTP method' })
  @ApiResponse({ status: 200, description: 'Performance report generated successfully', type: PerformanceReportDto })
  async getPerformanceReport(
    @Query(ValidationPipe) filters: GetPerformanceReportDto,
  ): Promise<PerformanceReportDto> {
    return await this.performanceService.generateReport(filters);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get performance metrics' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO string)' })
  @ApiQuery({ name: 'endpoint', required: false, description: 'Filter by endpoint' })
  @ApiQuery({ name: 'method', required: false, description: 'Filter by HTTP method' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved successfully', type: [PerformanceMetrics] })
  async getMetrics(
    @Query(ValidationPipe) filters: GetPerformanceReportDto,
  ): Promise<PerformanceMetrics[]> {
    return await this.performanceService.getMetrics(filters);
  }

  @Get('health')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'Health status retrieved successfully' })
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    averageResponseTime: number;
    errorRate: number;
    totalRequests: number;
  }> {
    return await this.performanceService.getHealthStatus();
  }

  @Get()
  @ApiOperation({ summary: 'Get all reports' })
  @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
  async getAllReports(): Promise<any[]> {
    return this.reports.map((r) => ({
      id: r.id,
      title: r.title,
      createdAt: r.generatedAt,
      status: 'completed',
      metrics: {
        totalRequests: r.data?.rawMetrics?.totalRequests ?? 0,
        averageResponseTime: r.data?.rawMetrics?.averageResponseTime ?? 0,
        p90: r.data?.rawMetrics?.p90 ?? undefined,
        errorRate: r.data?.rawMetrics?.errorRate ?? 0,
        uptime: r.data?.rawMetrics?.uptime ?? undefined,
      },
      summary: (r.data?.aiAnalysis || '').toString().slice(0, 500),
    }));
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate new AI-powered performance report' })
  @ApiResponse({ status: 201, description: 'Report generated successfully' })
  async generateNewReport(@Body() params?: any): Promise<any> {
    try {
      const performanceReport = await this.performanceService.generateReport(params || {});
      const performanceMetrics = await this.performanceService.getMetrics(params || {});
      const { AIService } = await import('../services/ai.service');
      const aiService = new (AIService as any)(
        this.performanceService['performanceRepository'],
        { get: () => null } as any
      );

      const analysisData = {
        summary: performanceReport,
        recentMetrics: performanceMetrics.slice(0, 1000),
        timeRange: {
          start: params?.startDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          end: params?.endDate || new Date().toISOString()
        },
        totalRequests: performanceReport.totalRequests,
        averageResponseTime: performanceReport.averageResponseTime,
        p90: performanceReport.p90,
        errorRate: performanceReport.errorRate,
        uptime: performanceReport.uptime,
        endpointBreakdown: performanceReport.endpointStats,
        topSlowEndpoints: performanceReport.topSlowEndpoints,
        topErrorEndpoints: performanceReport.topErrorEndpoints,
        anomalies: performanceReport.anomalies,
        timeSeries: performanceReport.timeSeries,
        distributions: {
          responseTime: performanceReport.responseTimeDistribution,
          statusCodes: performanceReport.statusCodeDistribution,
          methods: performanceReport.methodDistribution,
        }
      };

      const analysisPrompt = `You are an SRE assistant. Produce a clear, actionable performance report from the provided data. Include: health status, KPIs (avg, p50/p90/p99, error rate, uptime), top slow/error endpoints, trends from time series, anomalies, and 3-5 prioritized recommendations.`;

      let aiAnalysis = null;
      try {
        const aiResponse = await aiService.analyzePerformanceData(analysisData, analysisPrompt);
        aiAnalysis = aiResponse.response;
      } catch (aiError) {
        this.logger.warn('AI analysis failed, generating basic report:', aiError.message);
        aiAnalysis = this.generateBasicAnalysis(performanceReport);
      }

      const report = {
        id: `report-${Date.now()}`,
        title: 'AI-Powered Performance Report',
        generatedAt: new Date().toISOString(),
        type: 'performance_analysis',
        timeRange: analysisData.timeRange,
        data: {
          rawMetrics: performanceReport,
          aiAnalysis: aiAnalysis,
          recommendations: this.generateRecommendations(performanceReport),
          healthScore: this.calculateHealthScore(performanceReport)
        },
        metadata: {
          totalRequests: analysisData.totalRequests,
          avgResponseTime: analysisData.averageResponseTime,
          p90: performanceReport.p90,
          errorRate: analysisData.errorRate,
          uptime: performanceReport.uptime,
          generatedBy: 'AI Performance Analyzer'
        }
      };

      this.reports.unshift(report);

      return report;
    } catch (error) {
      this.logger.error('Failed to generate AI report:', error);
      const basicReport = await this.performanceService.generateReport(params || {});
      const report = {
        id: `report-${Date.now()}`,
        title: 'Basic Performance Report',
        generatedAt: new Date().toISOString(),
        type: 'basic_performance',
        data: { rawMetrics: basicReport },
        status: 'failed'
      };
      this.reports.unshift(report);
      return report;
    }
  }

  private generateBasicAnalysis(report: any): string {
    const { totalRequests, averageResponseTime, errorRate, successRate, p90, p99, uptime } = report;

    let analysis = `## Performance Analysis Report\n\n`;

    analysis += `### System Health Status\n`;
    if (errorRate < 1 && averageResponseTime < 500) {
      analysis += `✅ HEALTHY - Low errors and fast responses.\n\n`;
    } else if (errorRate < 5 && averageResponseTime < 2000) {
      analysis += `⚠️ WARNING - Some concerns to monitor.\n\n`;
    } else {
      analysis += `🚨 CRITICAL - High errors or slow responses, act now.\n\n`;
    }

    analysis += `### Key Performance Indicators\n`;
    analysis += `- Total Requests: ${totalRequests.toLocaleString()}\n`;
    analysis += `- Avg Response Time: ${averageResponseTime}ms\n`;
    analysis += `- p90/p99: ${p90}ms / ${p99}ms\n`;
    analysis += `- Success/Error Rate: ${successRate.toFixed(2)}% / ${errorRate.toFixed(2)}%\n`;
    if (typeof uptime === 'number') analysis += `- Uptime (approx): ${uptime}%\n`;
    analysis += `\n`;

    analysis += `### Recommendations\n`;
    this.generateRecommendations(report).forEach((r, i) => (analysis += `${i + 1}. ${r}\n`));

    return analysis;
  }

  private generateRecommendations(report: any): string[] {
    const recommendations: string[] = [];
    if (report.p90 > 1000) recommendations.push('Investigate top slow endpoints (p90 > 1s); optimize code paths and database queries.');
    if (report.errorRate > 5) recommendations.push('Audit error-prone endpoints; add retries, input validation, and improved error handling.');
    if ((report.topErrorEndpoints || []).length) recommendations.push('Prioritize fixes on the top 2 error endpoints.');
    if ((report.topSlowEndpoints || []).length) recommendations.push('Add caching or pagination on the top 2 slow endpoints.');
    recommendations.push('Set SLOs and add alerts for p90 latency and error rate.');
    return recommendations;
  }

  private calculateHealthScore(report: any): number {
    let score = 100;
    if (report.averageResponseTime > 500) score -= 10;
    if (report.averageResponseTime > 1000) score -= 15;
    if (report.averageResponseTime > 2000) score -= 20;
    score -= Math.min(report.errorRate * 5, 40);
    if (typeof report.uptime === 'number' && report.uptime < 99) score -= (99 - report.uptime);
    return Math.max(0, Math.min(100, score));
  }

  @Get('summary/current')
  @ApiOperation({ summary: 'Get current system summary' })
  @ApiResponse({ status: 200, description: 'Current summary retrieved successfully' })
  async getCurrentSummary(): Promise<any> {
    const healthStatus = await this.performanceService.getHealthStatus();
    return {
      totalRequests: healthStatus.totalRequests,
      averageResponseTime: healthStatus.averageResponseTime,
      errorRate: healthStatus.errorRate,
      status: healthStatus.status,
      timestamp: new Date()
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report by ID' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Report retrieved successfully' })
  async getReport(@Param('id') id: string): Promise<any> {
    const report = this.reports.find((r) => r.id === id);
    if (!report) return { id, error: 'Not found' };
    return report;
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Report download content' })
  async downloadReport(@Param('id') id: string): Promise<any> {
    const report = this.reports.find((r) => r.id === id);
    if (!report) return { error: 'Not found' };

    const lines: string[] = [];
    lines.push(`# ${report.title}`);
    lines.push(`Generated At: ${report.generatedAt}`);
    lines.push('');
    lines.push('## Summary Metrics');
    const raw = report.data?.rawMetrics || {};
    lines.push(`Total Requests: ${raw.totalRequests ?? 0}`);
    lines.push(`Average Response Time: ${raw.averageResponseTime ?? 0} ms`);
    if (raw.p50 != null) lines.push(`p50: ${raw.p50} ms`);
    if (raw.p90 != null) lines.push(`p90: ${raw.p90} ms`);
    if (raw.p99 != null) lines.push(`p99: ${raw.p99} ms`);
    if (raw.uptime != null) lines.push(`Uptime: ${raw.uptime}%`);
    lines.push(`Success Rate: ${raw.successRate ?? 0}%`);
    lines.push(`Error Rate: ${raw.errorRate ?? 0}%`);
    lines.push('');
    lines.push('## AI Analysis');
    lines.push(report.data?.aiAnalysis || 'N/A');
    lines.push('');
    lines.push('## Recommendations');
    (report.data?.recommendations || []).forEach((rec) => lines.push(`- ${rec}`));

    return {
      filename: `${report.id}.txt`,
      content: lines.join('\n'),
    };
  }
}
