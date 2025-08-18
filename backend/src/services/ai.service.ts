import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import axios from 'axios';
import { AIConfiguration, ModelProvider } from '../entities/ai-configuration.entity';

export interface AIResponse {
  response: string;
  modelUsed: string;
  responseTime: number;
  tokensUsed: number;
  config: {
    temperature: number;
    maxTokens: number;
    topP: number;
  };
}

export interface GenerationOptions {
  configId?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  promptType?: string;
  context?: string;
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private openaiClient: OpenAI | null = null;
  private defaultConfig: AIConfiguration | null = null;

  constructor(
    @InjectRepository(AIConfiguration)
    private readonly aiConfigRepository: Repository<AIConfiguration>,
    private readonly configService: ConfigService,
  ) {
    // Initialize in constructor
    this.initialize().catch(error => {
      this.logger.error('Failed to initialize AI service:', error);
    });
  }

  async initialize(): Promise<void> {
    try {
      // Load default active configuration
      this.defaultConfig = await this.aiConfigRepository.findOne({
        where: { isActive: true },
      });

      if (!this.defaultConfig) {
        this.logger.warn('No active AI configuration found, creating default');
        await this.createDefaultConfiguration();
      }
    } catch (error) {
      this.logger.error('Failed to initialize AI service, creating default configuration:', error);
      await this.createDefaultConfiguration();
    }
  }

  private async createDefaultConfiguration(): Promise<void> {
    try {
      // Create a default configuration based on environment and available secrets
      const isProduction = this.configService.get('NODE_ENV') === 'production';
      const hasOpenAIKey = !!this.configService.get('OPENAI_API_KEY');
      
      // Prefer OpenAI only if a key is actually present
      const useOpenAI = hasOpenAIKey;
      
      if (!useOpenAI && isProduction) {
        this.logger.warn('No OPENAI_API_KEY configured in production. Defaulting to Olloma configuration, which requires a reachable Olloma baseUrl.');
      }
      
      const defaultConfig = this.aiConfigRepository.create({
        name: useOpenAI ? 'Default OpenAI' : 'Default Ollama',
        modelProvider: useOpenAI ? ModelProvider.OPENAI : ModelProvider.OLLAMA,
        modelName: useOpenAI ? 'gpt-3.5-turbo' : 'llama2',
        systemPrompt: 'You are a helpful AI assistant.',
        temperature: 0.3,
        maxTokens: 1024,
        topP: 1.0,
        frequencyPenalty: 0,
        presencePenalty: 0,
        isActive: true,
        baseUrl: useOpenAI ? undefined : (this.configService.get('OLLAMA_BASE_URL') || 'http://localhost:11434'),
        apiKey: useOpenAI ? this.configService.get('OPENAI_API_KEY') : undefined,
        additionalSettings: {
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          environment: isProduction ? 'production' : 'development',
        }
      });
      
      this.defaultConfig = await this.aiConfigRepository.save(defaultConfig);
      this.logger.log(`Created default AI configuration: ${this.defaultConfig.name}`);
    } catch (error) {
      const hasOpenAIKey = !!this.configService.get('OPENAI_API_KEY');
      this.logger.error('Failed to create default AI configuration:', error);
      // Create an in-memory fallback configuration
      this.defaultConfig = {
        id: 'fallback',
        name: 'Fallback Configuration',
        modelProvider: hasOpenAIKey ? ModelProvider.OPENAI : ModelProvider.OLLAMA,
        modelName: hasOpenAIKey ? 'gpt-3.5-turbo' : 'llama2',
        systemPrompt: 'You are a helpful AI assistant.',
        temperature: 0.3,
        maxTokens: 1024,
        topP: 1.0,
        frequencyPenalty: 0,
        presencePenalty: 0,
        isActive: true,
        apiKey: hasOpenAIKey ? this.configService.get('OPENAI_API_KEY') : undefined,
        baseUrl: hasOpenAIKey ? undefined : (this.configService.get('OLLAMA_BASE_URL') || 'http://localhost:11434'),
        additionalSettings: {},
        parameters: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        conversations: [],
      } as any;
    }
  }

  private async getOpenAIClient(apiKey?: string): Promise<OpenAI> {
    const key = apiKey || this.defaultConfig?.apiKey || this.configService.get('OPENAI_API_KEY');
    if (!key) {
      throw new Error('OpenAI API key not provided');
    }

    if (!this.openaiClient || (this.openaiClient as any).apiKey !== key) {
      this.openaiClient = new OpenAI({ apiKey: key });
    }
    return this.openaiClient;
  }

  async generateResponse(prompt: string, options: GenerationOptions = {}): Promise<AIResponse> {
    const startTime = Date.now();
    
    let config: AIConfiguration | null = null;
    
    if (options.configId) {
      // Use specific configuration if provided
      config = await this.aiConfigRepository.findOne({
        where: { id: options.configId },
      });
      if (!config) {
        this.logger.warn(`Configuration with ID ${options.configId} not found, falling back to default`);
      }
    }
    
    if (!config) {
      // Always fetch the current active configuration instead of using cached
      config = await this.aiConfigRepository.findOne({
        where: { isActive: true },
      });
    }

    if (!config) {
      // Re-initialize to create a default configuration
      await this.initialize();
      config = this.defaultConfig;
      
      if (!config) {
        throw new Error('No AI configuration available and unable to create default');
      }
    }

    // Validate the configuration has required fields
    if (!config.modelProvider) {
      this.logger.error('Configuration missing model provider:', config);
      throw new Error('Configuration missing model provider');
    }

    // Convert config to plain object for better logging and handling
    const configObj = {
      modelProvider: config.modelProvider,
      modelName: config.modelName || 'gpt-3.5-turbo',
      systemPrompt: config.systemPrompt || 'You are a helpful AI assistant.',
      temperature: config.temperature || 0.3,
      maxTokens: config.maxTokens || 1024,
      topP: config.topP || 1.0,
      frequencyPenalty: config.frequencyPenalty || 0,
      presencePenalty: config.presencePenalty || 0,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
    };

    // Merge config with options
    const finalConfig = {
      ...configObj,
      ...options,
    };

    this.logger.log(`Generating response with provider: ${finalConfig.modelProvider}, model: ${finalConfig.modelName}`);

    try {
      switch (finalConfig.modelProvider) {
        case ModelProvider.OPENAI:
          const openaiResponse = await this.generateOpenAIResponse(prompt, finalConfig);
          return {
            response: openaiResponse.choices[0].message.content || '',
            modelUsed: `${finalConfig.modelProvider}:${finalConfig.modelName}`,
            responseTime: Date.now() - startTime,
            tokensUsed: openaiResponse.usage?.total_tokens || 0,
            config: {
              temperature: finalConfig.temperature,
              maxTokens: finalConfig.maxTokens,
              topP: finalConfig.topP,
            },
          };

        case ModelProvider.OLLAMA:
          try {
            const ollamaResponse = await this.generateOllamaResponse(prompt, finalConfig);
            return {
              response: ollamaResponse.response,
              modelUsed: `${finalConfig.modelProvider}:${finalConfig.modelName}`,
              responseTime: ollamaResponse.responseTime,
              tokensUsed: ollamaResponse.tokensUsed,
              config: ollamaResponse.config,
            };
          } catch (ollamaError) {
            this.logger.warn('Ollama not available, attempting fallback to OpenAI', ollamaError.message);
            
            // Try to fallback to OpenAI if available
            const openaiKey = this.configService.get('OPENAI_API_KEY');
            if (openaiKey) {
              this.logger.log('Falling back to OpenAI');
              const fallbackConfig = {
                ...finalConfig,
                modelProvider: ModelProvider.OPENAI,
                modelName: 'gpt-3.5-turbo',
                apiKey: openaiKey,
              };
              
              const openaiResponse = await this.generateOpenAIResponse(prompt, fallbackConfig);
              return {
                response: openaiResponse.choices[0].message.content || '',
                modelUsed: `fallback-openai:${fallbackConfig.modelName}`,
                responseTime: Date.now() - startTime,
                tokensUsed: openaiResponse.usage?.total_tokens || 0,
                config: {
                  temperature: finalConfig.temperature,
                  maxTokens: finalConfig.maxTokens,
                  topP: finalConfig.topP,
                },
              };
            } else {
              throw ollamaError;
            }
          }

        default:
          this.logger.error(`Unsupported model provider: ${finalConfig.modelProvider}`);
          throw new Error(`Unsupported model provider: ${finalConfig.modelProvider}`);
      }
    } catch (error) {
      this.logger.error('AI generation failed:', error);
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  private async generateOpenAIResponse(prompt: string, config: any): Promise<any> {
    const client = await this.getOpenAIClient(config.apiKey);
    
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: config.systemPrompt },
      { role: 'user', content: prompt },
    ];

    return await client.chat.completions.create({
      model: config.modelName || 'gpt-3.5-turbo',
      messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      top_p: config.topP,
      frequency_penalty: config.frequencyPenalty || 0,
      presence_penalty: config.presencePenalty || 0,
    });
  }

  private async generateOllamaResponse(prompt: string, config: any): Promise<any> {
    // Use the baseUrl from config - no hardcoding
    // For production deployments, this should come from the AI configuration
    let baseUrl = config.baseUrl || 'http://127.0.0.1:11434';

    // Auto-upgrade PageKite HTTP to HTTPS for better compatibility
    if (baseUrl.includes('pagekite.me') && baseUrl.startsWith('http://')) {
      this.logger.log(`Upgrading PageKite URL to HTTPS: ${baseUrl} -> ${baseUrl.replace('http://', 'https://')}`);
      baseUrl = baseUrl.replace('http://', 'https://');
    }

    const startTime = Date.now();
    
    const headers: any = {
      'Content-Type': 'application/json',
      'User-Agent': 'Backend-AI-Service/1.0',
      'Accept': 'application/json',
    };
    
    // Add special headers for tunneling services
    if (baseUrl.includes('loca.lt')) {
      headers['bypass-tunnel-reminder'] = 'true';
    } else if (baseUrl.includes('pagekite.me')) {
      try {
        const url = new URL(baseUrl);
        headers['Host'] = url.hostname;
      } catch (error) {
        this.logger.warn('Failed to parse baseUrl for Host header:', baseUrl);
      }
    }
    
    this.logger.log(`Attempting to connect to Ollama at: ${baseUrl}`);
    
    const fullPrompt = `${config.systemPrompt}\n\nUser: ${prompt}\nAssistant:`;

    try {
      // Quick precheck to avoid Heroku router timeouts if the tunnel isn't reachable
      try {
        await axios.get(`${baseUrl}/api/version`, { headers, timeout: 2500 });
      } catch (preErr: any) {
        const msg = preErr?.message || 'unknown error';
        this.logger.warn(`Ollama precheck failed at ${baseUrl}: ${msg}`);
        throw new Error(`Ollama not reachable (precheck): ${msg}`);
      }

      this.logger.log(`Sending request to Ollama at ${baseUrl}/api/generate`);
      
      const response = await axios.post(`${baseUrl}/api/generate`, {
        model: config.modelName || 'llama2',
        prompt: fullPrompt,
        options: {
          temperature: config.temperature,
          top_p: config.topP,
          num_predict: config.maxTokens,
          num_ctx: 2048,
        },
        keep_alive: '10m',
        stream: false,
      }, {
        headers,
        // Keep just under Heroku router 30s; allow extra time vs 25s
        timeout: 28000,
      });

      this.logger.log(`Received successful response from Ollama at ${baseUrl}`);
      
      const ollamaResponse = response.data;
      
      const responseTime = Date.now() - startTime;

      return {
        response: ollamaResponse.response || '',
        responseTime,
        tokensUsed: ollamaResponse.eval_count || 0,
        modelUsed: config.modelName || 'llama2',
        config: {
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          topP: config.topP,
        }
      };
    } catch (error) {
      // Enhanced error logging
      if (axios.isAxiosError(error)) {
        if (error.response) {
          this.logger.error(`Ollama request to ${baseUrl} failed with status ${error.response.status}: ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
          this.logger.error(`Ollama request to ${baseUrl} failed - no response received. This could indicate a network, firewall, or tunnel issue.`);
        } else {
          this.logger.error(`Ollama request setup failed: ${error.message}`);
        }
      } else {
        this.logger.error(`Ollama request failed with unexpected error: ${error.message}`);
      }
      
      if (baseUrl.includes('pagekite.me') && error.message.includes('ECONNREFUSED')) {
        throw new Error(`PageKite tunnel connection refused. Ensure the PageKite tunnel is running and accessible at: ${baseUrl}`);
      }
      
      if (baseUrl.includes('pagekite.me') && (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND')) {
        throw new Error(`Cannot connect to PageKite tunnel at ${baseUrl}. Verify the tunnel is active and Ollama is running.`);
      }
      
      throw new Error(`Ollama request failed: ${error.message}`);
    }
  }

  async analyzePerformanceData(performanceData: any, prompt: string): Promise<AIResponse> {
    const contextPrompt = `
Based on the following performance data, ${prompt}

Performance Data:
${JSON.stringify(performanceData, null, 2)}

Please provide a detailed analysis including:
1. Key performance indicators
2. Potential bottlenecks
3. Recommendations for improvement
4. Risk assessment
`;

    return await this.generateResponse(contextPrompt, {
      promptType: 'performance_summary',
      temperature: 0.3,
    });
  }

  async detectAnomalies(performanceData: any, prompt: string): Promise<AIResponse> {
    const contextPrompt = `
Analyze the following performance data for anomalies: ${prompt}

Data:
${JSON.stringify(performanceData, null, 2)}

Identify:
1. Unusual patterns or spikes
2. Potential causes
3. Severity level (low/medium/high)
4. Recommended actions
`;

    return await this.generateResponse(contextPrompt, {
      promptType: 'anomaly_detection',
      temperature: 0.3,
    });
  }

  async generateChecklist(component: string, issue: string): Promise<AIResponse> {
    const prompt = `
Generate a comprehensive debugging checklist for ${component} experiencing ${issue}.

Include steps for:
1. Initial assessment
2. Data collection
3. Analysis procedures
4. Testing methods
5. Resolution steps
6. Prevention measures

Format as a numbered list with clear, actionable items.
`;

    return await this.generateResponse(prompt, {
      promptType: 'checklist_generation',
      temperature: 0.4,
    });
  }

  async assessConfigurationImpact(
    currentConfig: any,
    proposedConfig: any,
    prompt: string,
  ): Promise<AIResponse> {
    const contextPrompt = `
Assess the impact of changing configuration from:

Current: ${JSON.stringify(currentConfig, null, 2)}
Proposed: ${JSON.stringify(proposedConfig, null, 2)}

Question: ${prompt}

Provide:
1. Expected performance changes
2. Risk assessment
3. Recommended monitoring points
4. Rollback considerations
`;

    return await this.generateResponse(contextPrompt, {
      promptType: 'config_change_impact',
      temperature: 0.2,
    });
  }
}
