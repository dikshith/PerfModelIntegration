import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

// Use SQLite for development if no DB_PASSWORD is set
const isDevelopment = process.env.NODE_ENV !== 'production';
const usePostgres = process.env.DB_PASSWORD && process.env.DB_PASSWORD !== '';

const dataSourceOptions: DataSourceOptions = usePostgres ? {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'generative_ai_healthcare',
  synchronize: isDevelopment,
  logging: isDevelopment,
  entities: ['src/entities/**/*.entity.ts'],
  migrations: ['src/database/migrations/**/*.ts'],
  subscribers: ['src/database/subscribers/**/*.ts'],
  migrationsTableName: 'typeorm_migrations',
} : {
  type: 'sqlite',
  database: process.env.DB_NAME || 'generative_ai_healthcare.db',
  synchronize: true,
  logging: isDevelopment,
  entities: ['src/entities/**/*.entity.ts'],
  migrations: ['src/database/migrations/**/*.ts'],
  subscribers: ['src/database/subscribers/**/*.ts'],
  migrationsTableName: 'typeorm_migrations',
};

export const AppDataSource = new DataSource(dataSourceOptions);
