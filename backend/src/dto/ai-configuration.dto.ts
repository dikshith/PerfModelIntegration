import { IsString, IsEnum, IsNumber, IsBoolean, IsOptional, Min, Max, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ModelProvider } from '../entities/ai-configuration.entity';
import { AI_CONSTANTS } from '../common/constants/app.constants';

export class CreateAIConfigurationDto {
  @ApiProperty({ 
    description: 'Configuration name',
    example: 'Production OpenAI Config'
  })
  @IsString()
  name: string;

  @ApiProperty({ 
    enum: ModelProvider, 
    description: 'Model provider',
    example: ModelProvider.OPENAI
  })
  @IsEnum(ModelProvider)
  modelProvider: ModelProvider;

  @ApiProperty({ 
    description: 'Model name',
    example: AI_CONSTANTS.OPENAI_DEFAULT_MODEL
  })
  @IsString()
  modelName: string;

  @ApiPropertyOptional({ 
    description: 'System prompt',
    default: AI_CONSTANTS.DEFAULT_SYSTEM_PROMPT
  })
  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @ApiPropertyOptional({ 
    description: `Temperature (${AI_CONSTANTS.MIN_TEMPERATURE}-${AI_CONSTANTS.MAX_TEMPERATURE})`, 
    minimum: AI_CONSTANTS.MIN_TEMPERATURE, 
    maximum: AI_CONSTANTS.MAX_TEMPERATURE,
    default: AI_CONSTANTS.DEFAULT_TEMPERATURE
  })
  @IsOptional()
  @IsNumber()
  @Min(AI_CONSTANTS.MIN_TEMPERATURE)
  @Max(AI_CONSTANTS.MAX_TEMPERATURE)
  temperature?: number;

  @ApiPropertyOptional({ 
    description: `Max tokens (${AI_CONSTANTS.MIN_TOKENS}-${AI_CONSTANTS.MAX_TOKENS})`, 
    minimum: AI_CONSTANTS.MIN_TOKENS, 
    maximum: AI_CONSTANTS.MAX_TOKENS,
    default: AI_CONSTANTS.DEFAULT_MAX_TOKENS
  })
  @IsOptional()
  @IsNumber()
  @Min(AI_CONSTANTS.MIN_TOKENS)
  @Max(AI_CONSTANTS.MAX_TOKENS)
  maxTokens?: number;

  @ApiPropertyOptional({ 
    description: `Top P (${AI_CONSTANTS.MIN_TOP_P}-${AI_CONSTANTS.MAX_TOP_P})`, 
    minimum: AI_CONSTANTS.MIN_TOP_P, 
    maximum: AI_CONSTANTS.MAX_TOP_P,
    default: AI_CONSTANTS.DEFAULT_TOP_P
  })
  @IsOptional()
  @IsNumber()
  @Min(AI_CONSTANTS.MIN_TOP_P)
  @Max(AI_CONSTANTS.MAX_TOP_P)
  topP?: number;

  @ApiPropertyOptional({ 
    description: `Frequency penalty (${AI_CONSTANTS.MIN_PENALTY} to ${AI_CONSTANTS.MAX_PENALTY})`, 
    minimum: AI_CONSTANTS.MIN_PENALTY, 
    maximum: AI_CONSTANTS.MAX_PENALTY,
    default: AI_CONSTANTS.DEFAULT_FREQUENCY_PENALTY
  })
  @IsOptional()
  @IsNumber()
  @Min(AI_CONSTANTS.MIN_PENALTY)
  @Max(AI_CONSTANTS.MAX_PENALTY)
  frequencyPenalty?: number;

  @ApiPropertyOptional({ 
    description: `Presence penalty (${AI_CONSTANTS.MIN_PENALTY} to ${AI_CONSTANTS.MAX_PENALTY})`, 
    minimum: AI_CONSTANTS.MIN_PENALTY, 
    maximum: AI_CONSTANTS.MAX_PENALTY,
    default: AI_CONSTANTS.DEFAULT_PRESENCE_PENALTY
  })
  @IsOptional()
  @IsNumber()
  @Min(AI_CONSTANTS.MIN_PENALTY)
  @Max(AI_CONSTANTS.MAX_PENALTY)
  presencePenalty?: number;

  @ApiPropertyOptional({ 
    description: 'Is active configuration',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ 
    description: 'API key (required for OpenAI)',
    example: 'sk-...'
  })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ 
    description: 'Base URL (for custom endpoints)',
    example: AI_CONSTANTS.OLLAMA_DEFAULT_BASE_URL
  })
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Additional settings',
    example: {}
  })
  @IsOptional()
  @IsObject()
  additionalSettings?: Record<string, any>;
}

export class UpdateAIConfigurationDto {
  @ApiPropertyOptional({ 
    description: 'Configuration name'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ 
    enum: ModelProvider, 
    description: 'Model provider' 
  })
  @IsOptional()
  @IsEnum(ModelProvider)
  modelProvider?: ModelProvider;

  @ApiPropertyOptional({ 
    description: 'Model name'
  })
  @IsOptional()
  @IsString()
  modelName?: string;

  @ApiPropertyOptional({ 
    description: 'System prompt'
  })
  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @ApiPropertyOptional({ 
    description: `Temperature (${AI_CONSTANTS.MIN_TEMPERATURE}-${AI_CONSTANTS.MAX_TEMPERATURE})`, 
    minimum: AI_CONSTANTS.MIN_TEMPERATURE, 
    maximum: AI_CONSTANTS.MAX_TEMPERATURE
  })
  @IsOptional()
  @IsNumber()
  @Min(AI_CONSTANTS.MIN_TEMPERATURE)
  @Max(AI_CONSTANTS.MAX_TEMPERATURE)
  temperature?: number;

  @ApiPropertyOptional({ 
    description: `Max tokens (${AI_CONSTANTS.MIN_TOKENS}-${AI_CONSTANTS.MAX_TOKENS})`, 
    minimum: AI_CONSTANTS.MIN_TOKENS, 
    maximum: AI_CONSTANTS.MAX_TOKENS
  })
  @IsOptional()
  @IsNumber()
  @Min(AI_CONSTANTS.MIN_TOKENS)
  @Max(AI_CONSTANTS.MAX_TOKENS)
  maxTokens?: number;

  @ApiPropertyOptional({ 
    description: `Top P (${AI_CONSTANTS.MIN_TOP_P}-${AI_CONSTANTS.MAX_TOP_P})`, 
    minimum: AI_CONSTANTS.MIN_TOP_P, 
    maximum: AI_CONSTANTS.MAX_TOP_P
  })
  @IsOptional()
  @IsNumber()
  @Min(AI_CONSTANTS.MIN_TOP_P)
  @Max(AI_CONSTANTS.MAX_TOP_P)
  topP?: number;

  @ApiPropertyOptional({ 
    description: `Frequency penalty (${AI_CONSTANTS.MIN_PENALTY} to ${AI_CONSTANTS.MAX_PENALTY})`, 
    minimum: AI_CONSTANTS.MIN_PENALTY, 
    maximum: AI_CONSTANTS.MAX_PENALTY
  })
  @IsOptional()
  @IsNumber()
  @Min(AI_CONSTANTS.MIN_PENALTY)
  @Max(AI_CONSTANTS.MAX_PENALTY)
  frequencyPenalty?: number;

  @ApiPropertyOptional({ 
    description: `Presence penalty (${AI_CONSTANTS.MIN_PENALTY} to ${AI_CONSTANTS.MAX_PENALTY})`, 
    minimum: AI_CONSTANTS.MIN_PENALTY, 
    maximum: AI_CONSTANTS.MAX_PENALTY
  })
  @IsOptional()
  @IsNumber()
  @Min(AI_CONSTANTS.MIN_PENALTY)
  @Max(AI_CONSTANTS.MAX_PENALTY)
  presencePenalty?: number;

  @ApiPropertyOptional({ 
    description: 'Is active configuration'
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ 
    description: 'API key'
  })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ 
    description: 'Base URL'
  })
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Additional settings'
  })
  @IsOptional()
  @IsObject()
  additionalSettings?: Record<string, any>;
}
