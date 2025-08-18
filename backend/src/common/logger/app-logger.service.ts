import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppLogger implements LoggerService {
  private logger: winston.Logger;

  constructor(private configService: ConfigService) {
    this.createLogger();
  }

  private createLogger(): void {
    const logLevel = this.configService.get('LOG_LEVEL', 'info');
    const nodeEnv = this.configService.get('NODE_ENV', 'development');

    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.prettyPrint(),
    );

    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple(),
        ),
      }),
    ];

    // Add file transports in production (only if not on Heroku)
    const isHeroku = process.env.DYNO !== undefined;
    if (nodeEnv === 'production' && !isHeroku) {
      transports.push(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: logFormat,
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: logFormat,
        }),
      );
    }

    this.logger = winston.createLogger({
      level: logLevel,
      format: logFormat,
      transports,
      exitOnError: false,
    });
  }

  log(message: string, context?: string): void {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(message, { context });
  }

  // Additional utility methods
  logApiCall(method: string, url: string, statusCode: number, responseTime: number): void {
    this.logger.info('API Call', {
      method,
      url,
      statusCode,
      responseTime,
      context: 'HTTP',
    });
  }

  logDatabaseQuery(query: string, duration: number, context?: string): void {
    this.logger.debug('Database Query', {
      query,
      duration,
      context: context || 'Database',
    });
  }

  logAIInteraction(
    provider: string,
    model: string,
    tokens: number,
    responseTime: number,
    context?: string,
  ): void {
    this.logger.info('AI Interaction', {
      provider,
      model,
      tokens,
      responseTime,
      context: context || 'AI',
    });
  }
}
