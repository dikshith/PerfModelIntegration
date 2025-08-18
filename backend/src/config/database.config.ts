import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AIConfiguration } from '../entities/ai-configuration.entity';
import { ConversationHistory } from '../entities/conversation-history.entity';
import { PerformanceMetrics } from '../entities/performance-metrics.entity';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const databaseUrl = configService.get('DATABASE_URL');
  const forceSqlite = (configService.get('USE_SQLITE') || '').toString().toLowerCase() === 'true';
  const isProd = (configService.get('NODE_ENV') || '').toString().toLowerCase() === 'production';
  const isHeroku = process.env.DYNO !== undefined || (configService.get('DYNO') ? true : false);

  // Prefer Postgres if DATABASE_URL exists and not forcing SQLite
  const useSqlite = !databaseUrl || forceSqlite;

  if (useSqlite) {
    // Use /tmp on Heroku/production to ensure write permissions
    const defaultSqlitePath = isHeroku || isProd ? '/tmp/database.sqlite' : './database.sqlite';
    const sqlitePath = configService.get('SQLITE_PATH', defaultSqlitePath);

    return {
      type: 'sqlite',
      database: sqlitePath,
      entities: [AIConfiguration, ConversationHistory, PerformanceMetrics],
      synchronize: true,
      logging: configService.get('NODE_ENV') === 'development',
    } as TypeOrmModuleOptions;
  }

  const syncEnv = (configService.get('DB_SYNC') || '').toString().toLowerCase();
  const synchronize = syncEnv ? syncEnv === 'true' : true; // default true to ensure tables exist

  return {
    type: 'postgres',
    url: databaseUrl,
    entities: [AIConfiguration, ConversationHistory, PerformanceMetrics],
    synchronize,
    logging: configService.get('NODE_ENV') === 'development',
    ssl: isProd ? { rejectUnauthorized: false } : false,
  } as TypeOrmModuleOptions;
};
