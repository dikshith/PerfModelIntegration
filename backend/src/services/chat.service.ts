import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ConversationHistory } from '../entities/conversation-history.entity';
import { AIService } from './ai.service';
import { AIConfigurationService } from './ai-configuration.service';
import { CreateChatMessageDto, ChatResponseDto } from '../dto/chat.dto';
import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';
import { ConfigService } from '@nestjs/config';

// Simple knowledge base interface
interface KnowledgeItem {
  id: string;
  name: string;
  content: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private knowledgeBase: KnowledgeItem[] = [];

  constructor(
    @InjectRepository(ConversationHistory)
    private readonly conversationRepository: Repository<ConversationHistory>,
    private readonly aiService: AIService,
    private readonly aiConfigurationService: AIConfigurationService,
    private readonly configService: ConfigService,
  ) {}

  private sanitizeText(text: string): string {
    if (!text) return '';
    let t = text;
    // Normalize unicode (e.g., ligatures) and remove replacement chars
    try { t = t.normalize('NFKC'); } catch {}
    t = t.replace(/\uFFFD+/g, ' '); // drop � characters
    // Remove control characters
    t = t.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]+/g, ' ');
    // Keep letters, numbers, punctuation and spaces; drop other odd glyphs
    t = t.replace(/[^\p{L}\p{N}\p{P}\p{Zs}]/gu, ' ');
    // Collapse whitespace
    return t.replace(/\s+/g, ' ').trim();
  }

  private async getDefaultConfigId(): Promise<string | undefined> {
    try {
      const activeConfig = await this.aiConfigurationService.findActive();
      return activeConfig?.id;
    } catch (error) {
      this.logger.warn('No active AI configuration found');
      return undefined;
    }
  }

  private isReadableText(text: string): boolean {
    if (!text) return false;
    const len = text.length;
    if (len < 200) return false;
    const lettersAndSpaces = (text.match(/[\p{L}\p{N}\s]/gu) || []).length;
    const ratio = lettersAndSpaces / len;
    const words = (text.match(/[\p{L}\p{N}]{2,}/gu) || []).length;
    return ratio >= 0.7 && words >= 30; // simple heuristic
  }

  // Knowledge base management methods
  addKnowledgeItem(item: KnowledgeItem): void {
    const cleaned = this.sanitizeText(item.content || '');
    // Gate unreadable/scanned PDFs
    const readable = this.isReadableText(cleaned);
    const sanitized = { ...item, content: readable ? cleaned : '' };
    this.knowledgeBase.push(sanitized);
    if (!readable) {
      this.logger.warn(`Knowledge item looks non-extractable (possibly scanned): ${sanitized.name}. Content omitted.`);
    } else {
      this.logger.log(`Added knowledge item: ${sanitized.name} (${sanitized.content.length} characters)`);
    }
  }

  getKnowledgeBase(): KnowledgeItem[] {
    return this.knowledgeBase;
  }

  removeKnowledgeItem(id: string): void {
    const index = this.knowledgeBase.findIndex(item => item.id === id);
    if (index > -1) {
      const removed = this.knowledgeBase.splice(index, 1)[0];
      this.logger.log(`Removed knowledge item: ${removed.name}`);
    }
  }

  clearKnowledgeBase(): void {
    this.knowledgeBase = [];
    this.logger.log('Cleared knowledge base');
  }

  // Enhanced RAG search with better semantic matching
  private searchKnowledgeBase(query: string): string {
    if (this.knowledgeBase.length === 0) {
      this.logger.warn('RAG search requested but knowledge base is empty');
      return '';
    }

    this.logger.log(`RAG: Searching ${this.knowledgeBase.length} documents for: "${query}"`);

    const queryLower = query.toLowerCase().trim();
    let relevantContent = '';
    const foundDocuments: string[] = [];

    // Tighter chunking to keep prompts small and fast
    const toChunks = (text: string, chunkSize = 400, overlap = 60) => {
      const clean = this.sanitizeText(text);
      const chunks: string[] = [];
      for (let i = 0; i < clean.length; i += (chunkSize - overlap)) {
        chunks.push(clean.slice(i, i + chunkSize));
      }
      return chunks;
    };

    const terms = Array.from(new Set(
      queryLower
        .split(/[^\p{L}\p{N}]+/u)
        .filter(w => w && w.length > 2)
    ));

    const scoreChunk = (chunk: string) => {
      const lower = chunk.toLowerCase();
      let score = 0;
      for (const t of terms) {
        const re = new RegExp(`\\b${t}\\b`, 'gi');
        const m = lower.match(re);
        if (m) score += Math.min(10, m.length * 2);
      }
      if (/(^|\s)(introduction|abstract|conclusion|results|methods|background)(\s|\.|:)/i.test(chunk)) score += 3;
      return score;
    };

    const scored: { name: string; chunk: string; score: number }[] = [];

    for (const item of this.knowledgeBase) {
      const chunks = toChunks(item.content);
      for (const c of chunks) {
        const s = scoreChunk(c);
        if (s > 0) scored.push({ name: item.name, chunk: c, score: s });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    if (scored.length === 0) {
      this.logger.log('RAG: No matching chunks found');
      return '';
    }

    // Keep prompt small: top 3 chunks, each <= 380 chars, overall cap ~2400 chars
    const top = scored.slice(0, 3).map(s => ({ ...s, chunk: this.sanitizeText(s.chunk).slice(0, 380) }));
    top.forEach(s => { if (!foundDocuments.includes(s.name)) foundDocuments.push(s.name); });

    const parts: string[] = [];
    parts.push('=== KNOWLEDGE BASE CONTEXT (RAG MODE: CHUNKS) ===');
    for (const s of top) {
      parts.push(`From "${s.name}" (score ${s.score}):\n${s.chunk}`);
    }
    parts.push('=== END KNOWLEDGE BASE CONTEXT ===');

    relevantContent = parts.join('\n\n');
    if (relevantContent.length > 2400) {
      relevantContent = relevantContent.slice(0, 2400);
    }

    this.logger.log(`RAG: Using ${top.length} chunks from ${foundDocuments.join(', ')}`);
    return `\n\n${relevantContent}\n\n`;
  }

  // Helper: score and return top RAG chunks for extractive fallback
  private getTopRagChunks(query: string, topN = 3): { name: string; chunk: string; score: number }[] {
    if (!this.knowledgeBase.length) return [];

    const queryLower = (query || '').toLowerCase().trim();

    const toChunks = (text: string, chunkSize = 400, overlap = 60) => {
      const clean = this.sanitizeText(text || '');
      const chunks: string[] = [];
      for (let i = 0; i < clean.length; i += (chunkSize - overlap)) {
        chunks.push(clean.slice(i, i + chunkSize));
      }
      return chunks;
    };

    const terms = Array.from(new Set(
      queryLower
        .split(/[^\p{L}\p{N}]+/u)
        .filter(w => w && w.length > 2)
    ));

    const scoreChunk = (chunk: string) => {
      const lower = chunk.toLowerCase();
      let score = 0;
      for (const t of terms) {
        const re = new RegExp(`\\b${t}\\b`, 'gi');
        const m = lower.match(re);
        if (m) score += Math.min(10, m.length * 2);
      }
      if (/(^|\s)(introduction|abstract|conclusion|results|methods|background)(\s|\.|:)/i.test(chunk)) score += 3;
      return score;
    };

    const scored: { name: string; chunk: string; score: number }[] = [];
    for (const item of this.knowledgeBase) {
      const chunks = toChunks(item.content);
      for (const c of chunks) {
        const s = scoreChunk(c);
        if (s > 0) scored.push({ name: item.name, chunk: c, score: s });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, Math.max(1, topN)).map(s => ({ ...s, chunk: this.sanitizeText(s.chunk).slice(0, 380) }));
  }

  // Helper: build an extractive answer when LLM is unavailable
  private buildExtractiveFallback(query: string): string | null {
    const top = this.getTopRagChunks(query, 4);
    if (!top.length) {
      // If we have documents but none are usable (e.g., scanned PDFs), advise the user
      if (this.knowledgeBase.length && this.knowledgeBase.filter(k => (k.content || '').length < 60).length >= Math.ceil(this.knowledgeBase.length / 2)) {
        return 'Your uploaded documents appear to be scanned images or contain non-extractable text. I could not extract readable content. Please upload a text-based PDF/markdown or OCR the PDF, then try again.';
      }
      return null;
    }

    // Build an explicit follow-up instruction to push the model for title/main concepts
    let answer = 'Using the excerpts below, provide: 1) the document title, 2) 3–6 main concepts, and 3) a concise summary in 4–6 sentences.\n';
    const used = new Set<string>();
    for (const s of top) {
      if (!used.has(s.name)) {
        used.add(s.name);
        answer += `\n• ${s.name}:\n`;
      }
      const cleaned = this.sanitizeText(s.chunk);
      const snippet = cleaned.length > 380 ? cleaned.slice(0, 380) + '…' : cleaned;
      answer += snippet + '\n';
    }
    answer += '\nCited documents: ' + Array.from(used).join(', ');
    return answer;
  }

  async sendMessage(createMessageDto: CreateChatMessageDto): Promise<ChatResponseDto> {
    const { message, sessionId, configId, context, ragMode } = createMessageDto;
    const finalSessionId = sessionId || uuidv4();

    try {
      const startTime = Date.now();

      // --- Environment-based RAG gating (disable on hosted prod unless explicitly allowed) ---
      if (ragMode) {
        const nodeEnv = this.configService.get<string>('NODE_ENV');
        const allowFlag = this.configService.get<string | boolean>('ALLOW_RAG_IN_PROD');
        const allowRagInProd = allowFlag === 'true' || allowFlag === true || allowFlag === '1';
        const isHeroku = !!this.configService.get<string>('DYNO'); // present on Heroku dynos
        const isHostedProd = (nodeEnv === 'production' || nodeEnv === 'prod') && isHeroku;
        // Treat local runs as non-hosted even if NODE_ENV mistakenly set to production
        const isForceLocal = !!this.configService.get<string>('FORCE_LOCAL');
        if (isHostedProd && !allowRagInProd && !isForceLocal) {
          const notice = 'RAG is disabled on the hosted environment due to backend hosting limits. Run locally (npm run dev) to use document-grounded answers.';
          const conversation = this.conversationRepository.create({
            configId: configId || await this.getDefaultConfigId(),
            sessionId: finalSessionId,
            userMessage: message,
            assistantResponse: notice,
            context: context || null,
            responseTime: 0,
            tokenCount: 0,
            metadata: {
              model: 'rag-disabled',
              temperature: 0,
              maxTokens: 0,
              timestamp: new Date(),
              ragModeUsed: true,
              knowledgeBaseUsed: false,
              guardReason: 'rag-disabled-on-hosted-prod',
            } as any,
          });
          await this.conversationRepository.save(conversation);
          return {
            response: notice,
            sessionId: finalSessionId,
            responseTime: 0,
            tokenCount: 0,
            configId,
          };
        }
      }
      // --- End RAG gating ---

      // Early guard: if RAG is on and active provider is local-only Ollama (no public baseUrl),
      // return extractive fallback ONLY when no OpenAI key is available to fallback to.
      if (ragMode) {
        try {
          const activeCfg = await this.aiConfigurationService.findActive();
          const isOllama = String(activeCfg?.modelProvider || '').toLowerCase() === 'ollama';
          const baseUrl = activeCfg?.baseUrl || '';
          const localOnly = !baseUrl || /localhost|127\.0\.0\.1/i.test(baseUrl);
          const hasOpenAIKey = !!this.configService.get('OPENAI_API_KEY');
          if (isOllama && localOnly && this.knowledgeBase.length && !hasOpenAIKey) {
            const fallback = this.buildExtractiveFallback(message) || 'No relevant excerpts were found in your uploaded documents.';
            const conversation = this.conversationRepository.create({
              configId: activeCfg?.id || (await this.getDefaultConfigId()),
              sessionId: finalSessionId,
              userMessage: message,
              assistantResponse: fallback,
              context: context || null,
              responseTime: 0,
              tokenCount: 0,
              metadata: {
                model: 'extractive-fallback',
                temperature: 0,
                maxTokens: 0,
                timestamp: new Date(),
                ragModeUsed: true,
                knowledgeBaseUsed: true,
                guardReason: 'ollama-local-unreachable-on-server',
              } as any,
            });
            await this.conversationRepository.save(conversation);
            return {
              response: fallback,
              sessionId: finalSessionId,
              responseTime: 0,
              tokenCount: 0,
              configId: activeCfg?.id,
            };
          }
        } catch (e) {
          // ignore guard errors and proceed to normal path
        }
      }

      // Get conversation history for this session if sessionId is provided
      let conversationHistory: ConversationHistory[] = [];
      if (sessionId) {
        conversationHistory = await this.getConversationHistory(sessionId);
      }

      // Build conversation context from history
      let conversationContext = '';
      if (conversationHistory.length > 0) {
        conversationContext = '\n\nPrevious conversation:\n';
        conversationHistory.forEach((entry, index) => {
          conversationContext += `\nUser: ${entry.userMessage}\nAssistant: ${entry.assistantResponse}\n`;
        });
        conversationContext += '\nCurrent user message:\n';
      }

      // Perform RAG search ONLY if ragMode is enabled
      let knowledgeContext = '';
      if (ragMode) {
        knowledgeContext = this.searchKnowledgeBase(message);
        if (!knowledgeContext && this.knowledgeBase.length > 0) {
          this.logger.log(`RAG: No specific matches, including general document content`);
          // Keep general content small too
          knowledgeContext = '\n\n--- KNOWLEDGE BASE CONTEXT (RAG MODE - GENERAL CONTENT) ---\n';
          const cap = 2000;
          let used = 0;
          for (const item of this.knowledgeBase) {
            const clean = this.sanitizeText(item.content).slice(0, 380);
            const section = `\nDocument "${item.name}":\n${clean}`;
            if (used + section.length > cap) break;
            knowledgeContext += section;
            used += section.length;
          }
          knowledgeContext += '\n--- END KNOWLEDGE BASE CONTEXT ---\n';
        }
        this.logger.log(`RAG Mode: ${ragMode ? 'ENABLED' : 'DISABLED'} - Found ${knowledgeContext.length > 0 ? 'relevant' : 'no'} knowledge base content`);
      }

      // Combine all contexts: conversation + knowledge base (if RAG mode) + additional context
      let fullPrompt = conversationContext + message;
      
      if (ragMode && knowledgeContext) {
        fullPrompt = `${knowledgeContext}\nUsing only the content from the knowledge base above, answer the user. Be concise (max ~8 sentences). If the answer is not present in those documents, say you cannot find it in the uploaded documents. Always cite the document names you used.\n\nUser: ${message}\nAssistant:`;
      } else if (ragMode && !knowledgeContext) {
        fullPrompt += '\n\nNote: RAG mode is enabled but no relevant documents were found in the knowledge base for this query. Please respond normally.';
      }
      
      if (context) {
        fullPrompt += `\n\nAdditional context: ${context}`;
      }

      this.logger.log(`Processing message with RAG: ${ragMode}, Conversation history: ${conversationHistory.length} messages, Knowledge docs: ${this.knowledgeBase.length}`);

      // Generate AI response with context (for RAG)
      const aiResponse = await this.aiService.generateResponse(fullPrompt, {
        configId,
        context: context,
        // Tighter cap to avoid tunnel/router timeouts
        maxTokens: ragMode ? 300 : undefined,
      });

      const responseTime = Date.now() - startTime;

      // Save conversation history
      const conversation = this.conversationRepository.create({
        configId: configId || await this.getDefaultConfigId(),
        sessionId: finalSessionId,
        userMessage: message,
        assistantResponse: aiResponse.response,
        context,
        responseTime: aiResponse.responseTime,
        tokenCount: aiResponse.tokensUsed,
        metadata: {
          model: aiResponse.modelUsed || 'gpt-3.5-turbo',
          temperature: aiResponse.config?.temperature || 0.7,
          maxTokens: aiResponse.config?.maxTokens || 1000,
          timestamp: new Date(),
          ragModeUsed: ragMode || false,
          knowledgeBaseUsed: ragMode && knowledgeContext.length > 0,
          documentsCount: this.knowledgeBase.length,
        } as any,
      });

      await this.conversationRepository.save(conversation);

      return {
        response: aiResponse.response,
        sessionId: finalSessionId,
        responseTime: aiResponse.responseTime,
        tokenCount: aiResponse.tokensUsed,
        configId,
      };
    } catch (error) {
      this.logger.error('Error in chat service (handled):', error as any);

      // If RAG mode and we have documents, return an extractive answer instead of a generic config error
      let fallback = '';
      let kbUsed = false;
      if (ragMode && this.knowledgeBase.length) {
        const extract = this.buildExtractiveFallback(message);
        if (extract) {
          fallback = extract;
          kbUsed = true;
        }
      }

      if (!fallback) {
        fallback = ragMode
          ? 'I could not complete the answer using your uploaded documents due to a server configuration issue. Please check the AI provider settings on the server or try again.'
          : 'I could not complete the request due to a server configuration issue. Please try again in a moment.';
      }

      const conversation = this.conversationRepository.create({
        configId: await this.getDefaultConfigId(),
        sessionId: finalSessionId,
        userMessage: message,
        assistantResponse: fallback,
        context: context || null,
        responseTime: null,
        tokenCount: null,
        metadata: {
          model: kbUsed ? 'extractive-fallback' : 'unavailable',
          temperature: 0,
          maxTokens: 0,
          timestamp: new Date(),
          ragModeUsed: !!ragMode,
          knowledgeBaseUsed: kbUsed,
          error: !kbUsed,
        } as any,
      });
      await this.conversationRepository.save(conversation);

      return {
        response: fallback,
        sessionId: finalSessionId,
        responseTime: 0,
        tokenCount: 0,
        configId,
      };
    }
  }

  // Proxy AI analysis helpers for ChatController endpoints
  async analyzePerformanceData(data: any, prompt: string): Promise<ChatResponseDto> {
    const ai = await this.aiService.analyzePerformanceData(data, prompt);
    return {
      response: ai.response,
      sessionId: 'analysis',
      responseTime: ai.responseTime,
      tokenCount: ai.tokensUsed,
    };
  }

  async detectAnomalies(data: any, prompt: string): Promise<ChatResponseDto> {
    const ai = await this.aiService.detectAnomalies(data, prompt);
    return {
      response: ai.response,
      sessionId: 'anomalies',
      responseTime: ai.responseTime,
      tokenCount: ai.tokensUsed,
    };
  }

  async saveConversationPair(params: {
    sessionId: string;
    userMessage: string;
    assistantResponse: string;
    configId?: string;
    model?: string;
  }): Promise<ConversationHistory> {
    const { sessionId, userMessage, assistantResponse, configId, model } = params;
    const conversation = this.conversationRepository.create({
      configId: configId || (await this.getDefaultConfigId()),
      sessionId,
      userMessage,
      assistantResponse,
      responseTime: null,
      tokenCount: null,
      context: null,
      metadata: {
        model: model || 'external',
        temperature: 0,
        maxTokens: 0,
        timestamp: new Date(),
      } as any,
    });

    return await this.conversationRepository.save(conversation);
  }

  async getConversationHistory(sessionId: string): Promise<ConversationHistory[]> {
    return await this.conversationRepository.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
      relations: ['aiConfig'],
    });
  }

  async deleteConversation(sessionId: string): Promise<void> {
    await this.conversationRepository.delete({ sessionId });
  }

  async getAllSessions(): Promise<{ sessionId: string; lastMessage: Date; messageCount: number }[]> {
    const sessions = await this.conversationRepository
      .createQueryBuilder('conversation')
      .select('conversation.sessionId', 'sessionId')
      .addSelect('MAX(conversation.createdAt)', 'lastMessage')
      .addSelect('COUNT(*)', 'messageCount')
      .groupBy('conversation.sessionId')
      .orderBy('lastMessage', 'DESC')
      .getRawMany();

    return sessions;
  }

  // Load knowledge files from uploads directory on startup
  async onModuleInit() {
    try {
      const uploadsDir = path.resolve(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        return;
      }
      const files = fs.readdirSync(uploadsDir);
      for (const fileName of files) {
        const filePath = path.join(uploadsDir, fileName);
        try {
          const stat = fs.statSync(filePath);
          if (!stat.isFile()) continue;
          const ext = path.extname(fileName).toLowerCase();
          if (!['.txt', '.md', '.json', '.log', '.csv', '.pdf'].includes(ext)) continue;
          let content = '';
          if (ext === '.pdf') {
            const data = fs.readFileSync(filePath);
            const parsed = await pdfParse(data);
            content = parsed.text || '';
          } else {
            content = fs.readFileSync(filePath, 'utf-8');
          }
          content = this.sanitizeText(content);
          const item: KnowledgeItem = {
            id: `kb-${fileName}`,
            name: fileName,
            content,
            size: stat.size,
            type: `text/${ext.replace('.', '')}`,
            uploadedAt: stat.mtime,
          };
          if (!this.knowledgeBase.some(k => k.name === item.name)) {
            this.knowledgeBase.push(item);
          }
        } catch (e) {
          this.logger.warn(`Failed to load knowledge file ${fileName}: ${e.message}`);
        }
      }
      if (this.knowledgeBase.length) {
        this.logger.log(`Loaded ${this.knowledgeBase.length} knowledge files from disk for RAG.`);
      }
    } catch (err) {
      this.logger.warn('Failed during knowledge base initialization: ' + err.message);
    }
  }
}
