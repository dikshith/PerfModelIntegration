import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// Configuration
import { appConfig } from './config/app.config';
import { getDatabaseConfig } from './config/database.config';

// Modules
import { AIModule } from './modules/ai.module';
import { AIConfigurationModule } from './modules/ai-configuration.module';
import { ChatModule } from './modules/chat.module';
import { PerformanceModule } from './modules/performance.module';
import { HealthModule } from './modules/health.module';

// Middleware
import { PerformanceMiddleware } from './middleware/performance.middleware';

// Common
import { AppLogger } from './common/logger/app-logger.service';
import { APP_CONSTANTS } from './common/constants/app.constants';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => getDatabaseConfig(configService),
      inject: [ConfigService],
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get('RATE_LIMIT_WINDOW_MS', APP_CONSTANTS.DEFAULT_RATE_LIMIT_WINDOW_MS),
          limit: configService.get('RATE_LIMIT_MAX_REQUESTS', APP_CONSTANTS.DEFAULT_RATE_LIMIT_MAX_REQUESTS),
        },
      ],
      inject: [ConfigService],
    }),

    // Static Files
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', APP_CONSTANTS.UPLOAD_DIRECTORY),
      serveRoot: `/${APP_CONSTANTS.UPLOAD_DIRECTORY}`,
    }),

    // Feature Modules
    AIModule,
    AIConfigurationModule,
    ChatModule,
    PerformanceModule,
    HealthModule,
  ],
  providers: [AppLogger, PerformanceMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PerformanceMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}
