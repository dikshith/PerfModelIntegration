import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AIConfiguration, ModelProvider } from '../entities/ai-configuration.entity';
import { ConversationHistory } from '../entities/conversation-history.entity';
import { PerformanceMetrics } from '../entities/performance-metrics.entity';
import { getDatabaseConfig } from '../config/database.config';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config({ path: path.resolve(__dirname, '../../.env') });
config({ path: path.resolve(__dirname, '../../.env.local') });

const isHeroku = process.env.DYNO !== undefined;

export class DatabaseInitializer {
  private dataSource: DataSource;
  private configService: ConfigService;

  constructor() {
    // Create a simple config service that reads from process.env
    this.configService = new ConfigService();
    
    const dbConfig = getDatabaseConfig(this.configService);
    this.dataSource = new DataSource({
      ...dbConfig,
      entities: [AIConfiguration, ConversationHistory, PerformanceMetrics],
      synchronize: true, // This will create tables if they don't exist
      logging: true,
    } as any);

    if ((dbConfig as any).type === 'sqlite') {
      (this.dataSource.options as any).database = (process.env.SQLITE_PATH || (isHeroku ? '/tmp/database.sqlite' : './database.sqlite'));
    }
  }

  async initialize(): Promise<void> {
    try {
      console.log('🔄 Initializing database connection...');
      console.log('📊 Using database config:', {
        type: this.dataSource.options.type,
        database: (this.dataSource.options as any).database || 'PostgreSQL from URL',
      });
      
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
      }

      console.log('✅ Database connection initialized successfully');

      // Check if we need to seed data
      await this.ensureDefaultConfiguration();

      console.log('✅ Database initialization completed successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  private async ensureDefaultConfiguration(): Promise<void> {
    try {
      const aiConfigRepository = this.dataSource.getRepository(AIConfiguration);

      // Check if any active configuration exists
      const activeConfig = await aiConfigRepository.findOne({
        where: { isActive: true },
      });

      if (activeConfig) {
        console.log('✅ Active AI configuration already exists:', activeConfig.name);
        return;
      }

      console.log('🌱 Creating default AI configuration...');

      // Determine which provider to use based on environment
      const isProduction = process.env.NODE_ENV === 'production';
      const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
      
      console.log('🔧 Environment details:', {
        NODE_ENV: process.env.NODE_ENV,
        hasOpenAIKey,
        isProduction,
      });

      // Create default configuration
      const defaultConfig = aiConfigRepository.create({
        name: isProduction || hasOpenAIKey ? 'Default OpenAI Configuration' : 'Default Ollama Configuration',
        modelProvider: isProduction || hasOpenAIKey ? ModelProvider.OPENAI : ModelProvider.OLLAMA,
        modelName: isProduction || hasOpenAIKey ? 'gpt-3.5-turbo' : 'llama2',
        systemPrompt: 'You are a helpful AI assistant for healthcare systems.',
        temperature: 0.3,
        maxTokens: 1024,
        topP: 1.0,
        frequencyPenalty: 0,
        presencePenalty: 0,
        isActive: true,
        baseUrl: (isProduction || hasOpenAIKey) ? undefined : 
                 (isProduction ? 'https://your-pagekite-subdomain.pagekite.me' : 'http://localhost:11434'),
        apiKey: hasOpenAIKey ? process.env.OPENAI_API_KEY : undefined,
        additionalSettings: {
          createdBy: 'system-initializer',
          createdAt: new Date().toISOString(),
          environment: isProduction ? 'production' : 'development',
          description: isProduction || hasOpenAIKey ? 
                      'Default OpenAI configuration for production use' : 
                      'Default Ollama configuration for local development',
        }
      });

      const savedConfig = await aiConfigRepository.save(defaultConfig);
      console.log(`✅ Created default AI configuration: ${savedConfig.name} (ID: ${savedConfig.id})`);
    } catch (error) {
      console.error('❌ Failed to create default configuration:', error);
      // Don't throw here - the service can handle missing configs
    }
  }

  async destroy(): Promise<void> {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
    }
  }
}

// Export a function that can be used during app startup
export async function initializeDatabase(): Promise<void> {
  const initializer = new DatabaseInitializer();
  try {
    await initializer.initialize();
  } finally {
    await initializer.destroy();
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('🎉 Database initialization script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database initialization script failed:', error);
      process.exit(1);
    });
}
