import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('performance_metrics')
export class PerformanceMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  endpoint: string;

  @Column()
  method: string;

  @Column({
    type: 'int',
  })
  responseTime: number;

  @Column({
    type: 'int',
  })
  statusCode: number;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  clientIp: string;

  @Column({
    type: 'text',
    nullable: true,
    transformer: {
      to: (value: any) => value ? JSON.stringify(value) : null,
      from: (value: string) => value ? JSON.parse(value) : null,
    },
  })
  requestBody: Record<string, any>;

  @Column({
    type: 'text',
    nullable: true,
    transformer: {
      to: (value: any) => value ? JSON.stringify(value) : null,
      from: (value: string) => value ? JSON.parse(value) : null,
    },
  })
  responseBody: Record<string, any>;

  @Column({
    type: 'text',
    nullable: true,
  })
  errorMessage: string;

  @Column({
    type: 'text',
    nullable: true,
    transformer: {
      to: (value: any) => value ? JSON.stringify(value) : null,
      from: (value: string) => value ? JSON.parse(value) : null,
    },
  })
  metrics: Record<string, any>;

  @Column({
    type: 'text',
    nullable: true,
    transformer: {
      to: (value: any) => value ? JSON.stringify(value) : null,
      from: (value: string) => value ? JSON.parse(value) : null,
    },
  })
  metadata?: Record<string, any>;

  @Column({
    type: 'text',
    nullable: true,
    transformer: {
      to: (value: any) => value ? JSON.stringify(value) : null,
      from: (value: string) => value ? JSON.parse(value) : null,
    },
  })
  tags?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
