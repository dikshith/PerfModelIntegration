import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppLogger } from './common/logger/app-logger.service';
import { APP_CONSTANTS } from './common/constants/app.constants';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Get services
  const configService = app.get(ConfigService);
  const logger = app.get(AppLogger);

  // Set global logger
  app.useLogger(logger);

  // --- CORS (enable before other middlewares) ---
  const isProd = configService.get('NODE_ENV') === 'production';
  const explicitOrigins = [
    'http://localhost:4200',
    'http://localhost:3000',
  ];
  const envOrigin = configService.get('CORS_ORIGIN');
  const envOriginsCsv = configService.get('CORS_ORIGINS'); // comma-separated list
  const frontendUrl = configService.get('FRONTEND_URL');
  [envOrigin, frontendUrl].forEach((o) => { if (o) explicitOrigins.push(o); });
  if (envOriginsCsv) {
    envOriginsCsv.split(',')
      .map((o: string) => o.trim())
      .filter(Boolean)
      .forEach((o: string) => explicitOrigins.push(o));
  }
  const allowedHostRegex = [/\.vercel\.app$/i];

  app.enableCors({
    origin: isProd
      ? (origin, callback) => {
          if (!origin) return callback(null, true); // allow non-browser requests
          if (explicitOrigins.includes(origin)) return callback(null, true);
          try {
            const host = new URL(origin).hostname;
            if (allowedHostRegex.some((rx) => rx.test(host))) {
              return callback(null, true);
            }
          } catch {}
          return callback(new Error(`CORS blocked for origin: ${origin}`), false as any);
        }
      : true,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin'],
    exposedHeaders: ['Content-Length', 'ETag'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400,
  });
  // --- End CORS ---

  // Security
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        // Allow JSON/XHR from any origin (API only). If serving a website from this server, tighten this with env.
        connectSrc: ["'self'", '*'],
      },
    },
  }));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global response interceptor and exception filter
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // API prefix
  app.setGlobalPrefix(APP_CONSTANTS.API_PREFIX);

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle(APP_CONSTANTS.SWAGGER_TITLE)
    .setDescription(APP_CONSTANTS.SWAGGER_DESCRIPTION)
    .setVersion(APP_CONSTANTS.SWAGGER_VERSION)
    .addTag('AI Configuration', 'Manage LLM configurations')
    .addTag('Chat', 'Chat and conversation management')
    .addTag('Performance Reports', 'Performance metrics and reports')
    .addTag('Health', 'Health checks and system status')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(APP_CONSTANTS.SWAGGER_PATH, app, document, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: APP_CONSTANTS.SWAGGER_TITLE,
  });

  // Start server
  const port = process.env.PORT || configService.get('PORT') || APP_CONSTANTS.DEFAULT_PORT;
  const nodeEnv = configService.get('NODE_ENV', 'development');

  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Server is running on port ${port}`, 'Bootstrap');
  logger.log(`📝 Environment: ${nodeEnv}`, 'Bootstrap');
  
  if (nodeEnv === 'development') {
    logger.log(`📚 API Documentation available at http://localhost:${port}/${APP_CONSTANTS.SWAGGER_PATH}`, 'Bootstrap');
    logger.log(`❤️ Health check available at http://localhost:${port}/${APP_CONSTANTS.API_PREFIX}/health`, 'Bootstrap');
    logger.log('', 'Bootstrap');
    logger.log('Available API endpoints:', 'Bootstrap');
    logger.log(`  📋 /${APP_CONSTANTS.API_PREFIX}/config     - LLM Configuration management`, 'Bootstrap');
    logger.log(`  💬 /${APP_CONSTANTS.API_PREFIX}/chat      - Chatbot with RAG functionality`, 'Bootstrap');
    logger.log(`  📊 /${APP_CONSTANTS.API_PREFIX}/reports   - Performance evaluation and reports`, 'Bootstrap');
    logger.log(`  ❤️ /${APP_CONSTANTS.API_PREFIX}/health    - System health checks`, 'Bootstrap');
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
