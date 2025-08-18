import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChatMessageDto {
  @ApiProperty({ description: 'User message' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Session ID for conversation continuity' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'AI Configuration ID to use' })
  @IsOptional()
  @IsUUID()
  configId?: string;

  @ApiPropertyOptional({ description: 'Additional context for the message' })
  @IsOptional()
  @IsString()
  context?: string;

  @ApiPropertyOptional({ description: 'Enable RAG mode to use knowledge base documents' })
  @IsOptional()
  @IsBoolean()
  ragMode?: boolean;
}

export class ChatResponseDto {
  @ApiProperty({ description: 'Assistant response' })
  @IsString()
  response: string;

  @ApiProperty({ description: 'Session ID' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'Response time in milliseconds' })
  responseTime: number;

  @ApiProperty({ description: 'Token count used' })
  tokenCount: number;

  @ApiPropertyOptional({ description: 'Configuration used' })
  @IsOptional()
  @IsUUID()
  configId?: string;
}

// New DTO to allow saving conversation pairs from local providers (e.g., Ollama)
export class SaveChatHistoryDto {
  @ApiProperty({ description: 'Session ID' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'User message' })
  @IsString()
  userMessage: string;

  @ApiProperty({ description: 'Assistant response' })
  @IsString()
  assistantResponse: string;

  @ApiPropertyOptional({ description: 'AI Configuration ID to associate (optional)' })
  @IsOptional()
  @IsUUID()
  configId?: string;

  @ApiPropertyOptional({ description: 'Model identifier used to generate the response (e.g., ollama:llama3)' })
  @IsOptional()
  @IsString()
  model?: string;
}
