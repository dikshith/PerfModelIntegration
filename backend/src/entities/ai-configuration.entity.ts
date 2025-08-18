import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ConversationHistory } from './conversation-history.entity';
import { AI_CONSTANTS } from '../common/constants/app.constants';

export enum ModelProvider {
  OPENAI = 'openai',
  OLLAMA = 'ollama',
  HUGGINGFACE = 'huggingface',
  ANTHROPIC = 'anthropic',
}

@Entity('ai_configurations')
export class AIConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  modelProvider: ModelProvider;

  @Column()
  modelName: string;

  @Column({
    type: 'text',
    default: AI_CONSTANTS.DEFAULT_SYSTEM_PROMPT,
  })
  systemPrompt: string;

  @Column({
    type: 'float',
    default: AI_CONSTANTS.DEFAULT_TEMPERATURE,
  })
  temperature: number;

  @Column({
    type: 'int',
    default: AI_CONSTANTS.DEFAULT_MAX_TOKENS,
  })
  maxTokens: number;

  @Column({
    type: 'float',
    default: AI_CONSTANTS.DEFAULT_TOP_P,
  })
  topP: number;

  @Column({
    type: 'float',
    default: AI_CONSTANTS.DEFAULT_FREQUENCY_PENALTY,
  })
  frequencyPenalty: number;

  @Column({
    type: 'float',
    default: AI_CONSTANTS.DEFAULT_PRESENCE_PENALTY,
  })
  presencePenalty: number;

  @Column({
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  @Column({ nullable: true })
  apiKey: string;

  @Column({ nullable: true })
  baseUrl: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  parameters?: string; // Store as JSON string

  @Column({
    type: 'text',
    default: '{}',
    nullable: true,
    transformer: {
      to: (value: any) => {
        if (value === null || value === undefined) return '{}';
        if (typeof value === 'string') return value;
        try {
          return JSON.stringify(value);
        } catch {
          return '{}';
        }
      },
      from: (value: string) => {
        if (!value || value === '') return {};
        if (typeof value === 'object') return value; // Already parsed
        try {
          return JSON.parse(value);
        } catch (error) {
          console.warn('Failed to parse additionalSettings JSON:', value, error);
          return {};
        }
      },
    },
  })
  additionalSettings: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ConversationHistory, (conversation) => conversation.aiConfig)
  conversations: ConversationHistory[];
}
