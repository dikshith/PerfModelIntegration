import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AIConfiguration } from './ai-configuration.entity';

@Entity('conversation_history')
export class ConversationHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  configId: string;

  @Column()
  sessionId: string;

  @Column()
  userMessage: string;

  @Column('text')
  assistantResponse: string;

  @Column({ nullable: true })
  context: string;

  @Column({
    type: 'int',
    nullable: true,
  })
  responseTime: number;

  @Column({
    type: 'int',
    nullable: true,
  })
  tokenCount: number;

  @Column({
    type: 'text',
    transformer: {
      to: (value: any) => value ? JSON.stringify(value) : null,
      from: (value: string) => value ? JSON.parse(value) : null,
    },
  })
  metadata: {
    model: string;
    temperature: number;
    maxTokens: number;
    timestamp: Date;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => AIConfiguration, (config) => config.conversations, { onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'configId' })
  aiConfig: AIConfiguration;
}
