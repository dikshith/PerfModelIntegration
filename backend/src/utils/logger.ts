import { createLogger, format, transports } from 'winston';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();

export const logger = createLogger({
  level: configService.get('LOG_LEVEL', 'info'),
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    format.json(),
  ),
  defaultMeta: { service: 'ai-backend' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// If we're not in production, also log to the console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple(),
    ),
  }));
}

export class Logger {
  private context: string;

  constructor(context: string = 'Application') {
    this.context = context;
  }

  log(message: string, ...optionalParams: any[]): void {
    logger.info(message, { context: this.context, ...optionalParams });
  }

  error(message: string, trace?: string, ...optionalParams: any[]): void {
    logger.error(message, { context: this.context, trace, ...optionalParams });
  }

  warn(message: string, ...optionalParams: any[]): void {
    logger.warn(message, { context: this.context, ...optionalParams });
  }

  debug(message: string, ...optionalParams: any[]): void {
    logger.debug(message, { context: this.context, ...optionalParams });
  }

  verbose(message: string, ...optionalParams: any[]): void {
    logger.verbose(message, { context: this.context, ...optionalParams });
  }
}
