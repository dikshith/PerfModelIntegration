import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIConfiguration } from '../entities/ai-configuration.entity';
import { CreateAIConfigurationDto, UpdateAIConfigurationDto } from '../dto/ai-configuration.dto';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AIConfigurationService {
  constructor(
    @InjectRepository(AIConfiguration)
    private readonly aiConfigRepository: Repository<AIConfiguration>,
    private readonly configService: ConfigService,
  ) {}

  async create(createDto: CreateAIConfigurationDto): Promise<AIConfiguration> {
    // If this is set as active, deactivate all others
    if (createDto.isActive) {
      await this.aiConfigRepository.update({ isActive: true }, { isActive: false });
    }

    const config = this.aiConfigRepository.create(createDto);
    return await this.aiConfigRepository.save(config);
  }

  async findAll(): Promise<AIConfiguration[]> {
    return await this.aiConfigRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<AIConfiguration> {
    const config = await this.aiConfigRepository.findOne({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException(`AI Configuration with ID ${id} not found`);
    }

    return config;
  }

  async findActive(): Promise<AIConfiguration | null> {
    return await this.aiConfigRepository.findOne({
      where: { isActive: true },
    });
  }

  async update(id: string, updateDto: UpdateAIConfigurationDto): Promise<AIConfiguration> {
    const config = await this.findOne(id);

    // If this is being set as active, deactivate all others
    if (updateDto.isActive) {
      await this.aiConfigRepository.update({ isActive: true }, { isActive: false });
    }

    Object.assign(config, updateDto);
    return await this.aiConfigRepository.save(config);
  }

  async remove(id: string): Promise<void> {
    const config = await this.findOne(id);
    await this.aiConfigRepository.remove(config);
  }

  async setActive(id: string): Promise<AIConfiguration> {
    // Deactivate all configurations
    await this.aiConfigRepository.update({ isActive: true }, { isActive: false });

    // Activate the specified configuration
    await this.aiConfigRepository.update({ id }, { isActive: true });

    return await this.findOne(id);
  }

  async testConfiguration(id: string): Promise<{ success: boolean; message: string }> {
    const config = await this.findOne(id);
    
    try {
      // Basic validation
      if (!config.modelName) {
        return { success: false, message: 'Model name is required' };
      }

      if (config.modelProvider === 'openai' && !config.apiKey) {
        return { success: false, message: 'API key is required for OpenAI' };
      }

      // TODO: Add actual connection test based on provider
      return { success: true, message: 'Configuration is valid' };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  async getActiveConfiguration(): Promise<AIConfiguration> {
    const activeConfig = await this.findActive();
    if (!activeConfig) {
      throw new Error('No active AI configuration found');
    }
    return activeConfig;
  }

  async activate(id: string): Promise<AIConfiguration> {
    return await this.setActive(id);
  }

  async getAvailableOllamaModels(): Promise<any> {
    // This endpoint provides information for the frontend to fetch models directly from user's local Ollama
    return {
      success: true,
      message: 'To get available models, the frontend should make a request directly to the user\'s local Ollama instance',
      endpoint: 'http://localhost:11434/api/tags',
      instructions: [
        'Make sure Ollama is running locally on port 11434',
        'The frontend will make a direct request to localhost:11434/api/tags',
        'This avoids CORS issues since both the frontend and Ollama are on the same machine',
        'Available models will be in the response under the "models" array'
      ],
      example: {
        method: 'GET',
        url: 'http://localhost:11434/api/tags',
        expectedResponse: {
          models: [
            {
              name: 'llama3.1:8b',
              model: 'llama3.1:8b',
              size: 4920753328,
              digest: '...'
            }
          ]
        }
      }
    };
  }

  // Server-side check to determine if Ollama is reachable (avoids browser CORS issues)
  async checkOllamaStatus(baseUrl?: string): Promise<{ success: boolean; isRunning: boolean; version?: string; error?: string }> {
    try {
      let url = baseUrl;
      if (!url) {
        const active = await this.findActive();
        url = active?.baseUrl || this.configService.get<string>('OLLAMA_BASE_URL') || 'http://127.0.0.1:11434';
      }

      if (url.includes('pagekite.me') && url.startsWith('http://')) {
        url = url.replace('http://', 'https://');
      }

      const headers: any = { 'Content-Type': 'application/json' };
      if (url.includes('pagekite.me')) {
        try {
          const u = new URL(url);
          headers['Host'] = u.hostname;
        } catch {}
      }

      const resp = await axios.get(`${url.replace(/\/$/, '')}/api/version`, { headers, timeout: 2500 });
      if (resp.status === 200 && resp.data?.version) {
        return { success: true, isRunning: true, version: resp.data.version };
      }
      return { success: false, isRunning: false, error: `HTTP ${resp.status}` };
    } catch (e: any) {
      return { success: false, isRunning: false, error: e?.message || 'Unknown error' };
    }
  }
}
