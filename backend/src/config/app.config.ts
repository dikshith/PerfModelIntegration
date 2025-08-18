export const appConfig = () => ({
  // Application
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  
  // Database
  useSqlite: process.env.USE_SQLITE === 'true',
  sqlitePath: process.env.SQLITE_PATH || './database.sqlite',
  
  // Database - PostgreSQL
  database: {
    type: process.env.DB_TYPE || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'generative_ai_healthcare',
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-in-production',
  },
  
  // AI Services
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enablePerformanceLogging: process.env.ENABLE_PERFORMANCE_LOGGING === 'true',
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },
});
