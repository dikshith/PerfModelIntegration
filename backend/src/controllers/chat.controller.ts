import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ValidationPipe,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { ChatService } from '../services/chat.service';
import { CreateChatMessageDto, ChatResponseDto, SaveChatHistoryDto } from '../dto/chat.dto';
import { ConversationHistory } from '../entities/conversation-history.entity';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  @ApiOperation({ summary: 'Send a chat message' })
  @ApiResponse({ status: 201, description: 'Message processed successfully', type: ChatResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async sendMessage(
    @Body(ValidationPipe) createMessageDto: CreateChatMessageDto,
  ): Promise<ChatResponseDto> {
    return await this.chatService.sendMessage(createMessageDto);
  }

  @Get('conversations/:sessionId')
  @ApiOperation({ summary: 'Get conversation history for a session' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'History retrieved successfully', type: [ConversationHistory] })
  async getConversationHistory(@Param('sessionId') sessionId: string): Promise<ConversationHistory[]> {
    return await this.chatService.getConversationHistory(sessionId);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get all chat sessions' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  async getSessions(): Promise<{ sessionId: string; lastMessage: Date; messageCount: number }[]> {
    return await this.chatService.getAllSessions();
  }

  @Get('history/:sessionId')
  @ApiOperation({ summary: 'Get conversation history for a session' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'History retrieved successfully', type: [ConversationHistory] })
  async getHistory(@Param('sessionId') sessionId: string): Promise<ConversationHistory[]> {
    return await this.chatService.getConversationHistory(sessionId);
  }

  @Delete('history/:sessionId')
  @ApiOperation({ summary: 'Delete conversation history for a session' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'History deleted successfully' })
  async deleteHistory(@Param('sessionId') sessionId: string): Promise<{ message: string }> {
    await this.chatService.deleteConversation(sessionId);
    return { message: 'Conversation history deleted successfully' };
  }

  @Post('upload-knowledge')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload knowledge file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  async uploadKnowledge(@UploadedFile() file: any): Promise<any> {
    if (!file) {
      throw new Error('No file uploaded');
    }

    // Persist the file to disk so knowledge can be reloaded on restart
    try {
      const uploadsDir = path.resolve(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
      const filePath = path.join(uploadsDir, safeName);
      fs.writeFileSync(filePath, file.buffer);
    } catch (e) {
      console.warn('Failed to persist uploaded file to disk:', e);
    }

    // Extract text
    let content = '';
    const ext = path.extname(file.originalname).toLowerCase();
    try {
      if (ext === '.pdf') {
        const parsed = await pdfParse(file.buffer);
        content = parsed.text || '';
      } else {
        content = file.buffer.toString('utf-8');
      }
    } catch (e) {
      console.warn('Failed to parse uploaded file content, falling back to raw text:', e);
      try { content = file.buffer.toString('utf-8'); } catch {}
    }

    const knowledgeItem = {
      id: `kb-${Date.now()}`,
      name: file.originalname,
      content: content,
      size: file.size,
      type: file.mimetype,
      uploadedAt: new Date()
    };

    this.chatService.addKnowledgeItem(knowledgeItem);

    return {
      id: knowledgeItem.id,
      name: knowledgeItem.name,
      size: knowledgeItem.size,
      type: knowledgeItem.type,
      uploadedAt: knowledgeItem.uploadedAt,
      status: 'ready',
      extractedChars: content.length
    };
  }

  @Get('knowledge')
  @ApiOperation({ summary: 'Get all knowledge files' })
  @ApiResponse({ status: 200, description: 'Knowledge files retrieved successfully' })
  async getKnowledgeFiles(): Promise<any> {
    const knowledgeBase = this.chatService.getKnowledgeBase();
    return {
      data: knowledgeBase.map(item => ({
        id: item.id,
        name: item.name,
        size: item.size,
        type: item.type,
        uploadedAt: item.uploadedAt,
        status: 'ready'
      })),
      total: knowledgeBase.length
    };
  }

  @Delete('knowledge/:id')
  @ApiOperation({ summary: 'Delete knowledge file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  async deleteKnowledgeFile(@Param('id') id: string): Promise<void> {
    this.chatService.removeKnowledgeItem(id);
  }

  @Post('knowledge/clear')
  @ApiOperation({ summary: 'Clear all knowledge files' })
  @ApiResponse({ status: 200, description: 'All files cleared successfully' })
  async clearKnowledge(): Promise<void> {
    this.chatService.clearKnowledgeBase();
  }

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze performance data with AI' })
  @ApiResponse({ status: 201, description: 'Analysis completed successfully', type: ChatResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async analyzePerformance(
    @Body() body: { data: any; prompt: string },
  ): Promise<ChatResponseDto> {
    return await this.chatService.analyzePerformanceData(body.data, body.prompt);
  }

  @Post('anomalies')
  @ApiOperation({ summary: 'Detect anomalies in performance data' })
  @ApiResponse({ status: 201, description: 'Anomaly detection completed successfully', type: ChatResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async detectAnomalies(
    @Body() body: { data: any; prompt: string },
  ): Promise<ChatResponseDto> {
    return await this.chatService.detectAnomalies(body.data, body.prompt);
  }

  @Post('history/save')
  @ApiOperation({ summary: 'Save a user/assistant message pair (e.g., from local Ollama)' })
  @ApiResponse({ status: 201, description: 'Conversation saved successfully' })
  async saveHistory(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true })) body: SaveChatHistoryDto,
  ): Promise<{ success: boolean; id: string }> {
    const saved = await this.chatService.saveConversationPair({
      sessionId: body.sessionId,
      userMessage: body.userMessage,
      assistantResponse: body.assistantResponse,
      configId: body.configId,
      model: body.model,
    });
    return { success: true, id: saved.id };
  }
}
