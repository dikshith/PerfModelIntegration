import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PerformanceService } from '../services/performance.service';
import { AppLogger } from '../common/logger/app-logger.service';

@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  constructor(
    private readonly performanceService: PerformanceService,
    private readonly logger: AppLogger,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, originalUrl: endpoint } = req;

    res.on('finish', async () => {
      try {
        const responseTime = Date.now() - startTime;
        const { statusCode } = res;

        // Log the API call
        this.logger.logApiCall(method, endpoint, statusCode, responseTime);

        // Record metrics in database (async, don't block response)
        setImmediate(async () => {
          try {
            await this.performanceService.recordMetrics(
              endpoint,
              method,
              responseTime,
              statusCode,
              {
                userAgent: req.get('User-Agent'),
                clientIp: req.ip,
                requestBody: this.sanitizeBody(req.body),
                additionalMetrics: {
                  contentLength: res.get('Content-Length'),
                  contentType: res.get('Content-Type'),
                },
              },
            );
          } catch (error) {
            this.logger.error('Failed to record performance metrics', error.stack, 'PerformanceMiddleware');
          }
        });
      } catch (error) {
        this.logger.error('Error in performance middleware', error.stack, 'PerformanceMiddleware');
      }
    });

    next();
  }

  private sanitizeBody(body: any): any {
    if (!body) return null;

    // Remove sensitive data
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'apiKey', 'token', 'secret', 'authorization'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}
