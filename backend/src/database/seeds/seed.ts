import { DataSource } from 'typeorm';
import { AIConfiguration, ModelProvider } from '../../entities/ai-configuration.entity';
import { ConversationHistory } from '../../entities/conversation-history.entity';
import { PerformanceMetrics } from '../../entities/performance-metrics.entity';
import { Logger } from '../../utils/logger';
import { config } from 'dotenv';

// Load environment variables
config();

// Create data source using the same logic as the app
const useSqlite = process.env.USE_SQLITE === 'true';

const dataSourceOptions = useSqlite ? {
  type: 'sqlite' as const,
  database: process.env.SQLITE_PATH || './database.sqlite',
  entities: [AIConfiguration, ConversationHistory, PerformanceMetrics],
  synchronize: true,
  logging: false,
} : {
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'generative_ai_healthcare',
  entities: [AIConfiguration, ConversationHistory, PerformanceMetrics],
  synchronize: true,
  logging: false,
};

const SeederDataSource = new DataSource(dataSourceOptions);

async function seedDatabase() {
  const logger = new Logger('DatabaseSeeder');
  
  try {
    // Initialize database connection
    if (!SeederDataSource.isInitialized) {
      await SeederDataSource.initialize();
    }

    logger.log('🌱 Starting database seeding...');

    const aiConfigRepository = SeederDataSource.getRepository(AIConfiguration);

    // Check if any configurations already exist
    const existingConfigs = await aiConfigRepository.count();
    if (existingConfigs > 0) {
      logger.log('Database already contains AI configurations. Skipping seeding.');
      return;
    }

    // Create default AI configurations
    const defaultConfigs = [
      {
        name: 'OpenAI GPT-3.5 Turbo',
        modelProvider: ModelProvider.OPENAI,
        modelName: 'gpt-3.5-turbo',
        systemPrompt: 'You are a helpful AI assistant specialized in healthcare performance analysis.',
        temperature: 0.3,
        maxTokens: 1024,
        topP: 1.0,
        frequencyPenalty: 0,
        presencePenalty: 0,
        isActive: true,
        additionalSettings: {
          description: 'Default OpenAI configuration for general use',
        },
      },
      {
        name: 'OpenAI GPT-4',
        modelProvider: ModelProvider.OPENAI,
        modelName: 'gpt-4',
        systemPrompt: 'You are an advanced AI assistant specialized in healthcare performance analysis and anomaly detection.',
        temperature: 0.2,
        maxTokens: 2048,
        topP: 0.9,
        frequencyPenalty: 0,
        presencePenalty: 0,
        isActive: false,
        additionalSettings: {
          description: 'GPT-4 configuration for complex analysis',
        },
      },
      {
        name: 'Ollama Llama2',
        modelProvider: ModelProvider.OLLAMA,
        modelName: 'llama2',
        systemPrompt: 'You are a healthcare performance analysis assistant.',
        temperature: 0.3,
        maxTokens: 1024,
        topP: 1.0,
        frequencyPenalty: 0,
        presencePenalty: 0,
        isActive: false,
        baseUrl: 'http://localhost:11434',
        additionalSettings: {
          description: 'Local Ollama Llama2 configuration',
        },
      },
      {
        name: 'Ollama Code Llama',
        modelProvider: ModelProvider.OLLAMA,
        modelName: 'codellama',
        systemPrompt: 'You are a code analysis assistant specialized in performance optimization and debugging.',
        temperature: 0.1,
        maxTokens: 2048,
        topP: 0.9,
        frequencyPenalty: 0,
        presencePenalty: 0,
        isActive: false,
        baseUrl: 'http://localhost:11434',
        additionalSettings: {
          description: 'Code-focused Ollama configuration',
        },
      },
    ];

    // Create and save configurations
    for (const configData of defaultConfigs) {
      const config = aiConfigRepository.create(configData);
      await aiConfigRepository.save(config);
      logger.log(`✅ Created AI configuration: ${configData.name}`);
    }

    logger.log('🎉 Database seeding completed successfully!');
    logger.log(`📊 Created ${defaultConfigs.length} AI configurations`);

  } catch (error) {
    logger.error('❌ Database seeding failed:', error.stack);
    throw error;
  } finally {
    if (SeederDataSource.isInitialized) {
      await SeederDataSource.destroy();
    }
  }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };
