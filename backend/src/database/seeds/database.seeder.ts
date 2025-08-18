import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { AIConfiguration, ModelProvider } from '../../entities/ai-configuration.entity';
import { AI_CONSTANTS } from '../../common/constants/app.constants';

export class DatabaseSeeder {
  private dataSource: DataSource;

  constructor() {
    this.dataSource = AppDataSource;
  }

  async run(): Promise<void> {
    try {
      // Initialize database connection
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
      }

      console.log('🌱 Starting database seeding...');

      // Seed AI Configurations
      await this.seedAIConfigurations();

      console.log('✅ Database seeding completed successfully!');
    } catch (error) {
      console.error('❌ Error during database seeding:', error);
      throw error;
    } finally {
      if (this.dataSource.isInitialized) {
        await this.dataSource.destroy();
      }
    }
  }

  private async seedAIConfigurations(): Promise<void> {
    const aiConfigRepository = this.dataSource.getRepository(AIConfiguration);

    // Check if configurations already exist
    const existingConfigs = await aiConfigRepository.count();
    if (existingConfigs > 0) {
      console.log('AI configurations already exist, skipping seeding');
      return;
    }

    const configurations = [
      {
        name: 'Default OpenAI Configuration',
        modelProvider: ModelProvider.OPENAI,
        modelName: AI_CONSTANTS.OPENAI_DEFAULT_MODEL,
        systemPrompt: AI_CONSTANTS.DEFAULT_SYSTEM_PROMPT,
        temperature: AI_CONSTANTS.DEFAULT_TEMPERATURE,
        maxTokens: AI_CONSTANTS.DEFAULT_MAX_TOKENS,
        topP: AI_CONSTANTS.DEFAULT_TOP_P,
        frequencyPenalty: AI_CONSTANTS.DEFAULT_FREQUENCY_PENALTY,
        presencePenalty: AI_CONSTANTS.DEFAULT_PRESENCE_PENALTY,
        isActive: false, // Will be activated manually
        additionalSettings: {
          description: 'Default OpenAI configuration for general use',
          environment: 'development',
        },
      },
      {
        name: 'Default Ollama Configuration',
        modelProvider: ModelProvider.OLLAMA,
        modelName: AI_CONSTANTS.OLLAMA_DEFAULT_MODEL,
        baseUrl: AI_CONSTANTS.OLLAMA_DEFAULT_BASE_URL,
        systemPrompt: AI_CONSTANTS.DEFAULT_SYSTEM_PROMPT,
        temperature: AI_CONSTANTS.DEFAULT_TEMPERATURE,
        maxTokens: AI_CONSTANTS.DEFAULT_MAX_TOKENS,
        topP: AI_CONSTANTS.DEFAULT_TOP_P,
        frequencyPenalty: AI_CONSTANTS.DEFAULT_FREQUENCY_PENALTY,
        presencePenalty: AI_CONSTANTS.DEFAULT_PRESENCE_PENALTY,
        isActive: true, // Default active configuration
        additionalSettings: {
          description: 'Default Ollama configuration for local development',
          environment: 'development',
        },
      },
      {
        name: 'Performance Analysis GPT-4',
        modelProvider: ModelProvider.OPENAI,
        modelName: 'gpt-4',
        systemPrompt: `${AI_CONSTANTS.DEFAULT_SYSTEM_PROMPT} You specialize in analyzing healthcare system performance metrics, identifying bottlenecks, and providing actionable recommendations for improvement.`,
        temperature: 0.2, // Lower temperature for more consistent analysis
        maxTokens: 2048,
        topP: AI_CONSTANTS.DEFAULT_TOP_P,
        frequencyPenalty: AI_CONSTANTS.DEFAULT_FREQUENCY_PENALTY,
        presencePenalty: AI_CONSTANTS.DEFAULT_PRESENCE_PENALTY,
        isActive: false,
        additionalSettings: {
          description: 'High-quality GPT-4 configuration optimized for performance analysis',
          environment: 'production',
          useCase: 'performance_analysis',
        },
      },
      {
        name: 'Quick Response Configuration',
        modelProvider: ModelProvider.OPENAI,
        modelName: 'gpt-3.5-turbo',
        systemPrompt: `You are a helpful AI assistant for healthcare systems. Provide quick, concise responses.`,
        temperature: 0.7, // Higher temperature for more creative responses
        maxTokens: 512, // Shorter responses for quick interactions
        topP: AI_CONSTANTS.DEFAULT_TOP_P,
        frequencyPenalty: AI_CONSTANTS.DEFAULT_FREQUENCY_PENALTY,
        presencePenalty: AI_CONSTANTS.DEFAULT_PRESENCE_PENALTY,
        isActive: false,
        additionalSettings: {
          description: 'Fast response configuration for quick queries',
          environment: 'production',
          useCase: 'quick_chat',
        },
      },
    ];

    for (const configData of configurations) {
      const config = aiConfigRepository.create(configData);
      await aiConfigRepository.save(config);
      console.log(`✅ Created AI configuration: ${config.name}`);
    }

    console.log(`🎉 Successfully seeded ${configurations.length} AI configurations`);
  }
}

// Run seeder if called directly
if (require.main === module) {
  const seeder = new DatabaseSeeder();
  seeder.run().catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
}
