import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateInitialTables1721376000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create AI Configurations table
    await queryRunner.createTable(
      new Table({
        name: 'ai_configurations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'modelProvider',
            type: 'enum',
            enum: ['openai', 'ollama', 'huggingface', 'anthropic'],
          },
          {
            name: 'modelName',
            type: 'varchar',
          },
          {
            name: 'systemPrompt',
            type: 'text',
            default: "'You are a performance analysis agent for healthcare systems.'",
          },
          {
            name: 'temperature',
            type: 'float',
            default: 0.3,
          },
          {
            name: 'maxTokens',
            type: 'int',
            default: 1024,
          },
          {
            name: 'topP',
            type: 'float',
            default: 1.0,
          },
          {
            name: 'frequencyPenalty',
            type: 'float',
            default: 0,
          },
          {
            name: 'presencePenalty',
            type: 'float',
            default: 0,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'apiKey',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'baseUrl',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'additionalSettings',
            type: 'jsonb',
            default: "'{}'",
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create Performance Metrics table
    await queryRunner.createTable(
      new Table({
        name: 'performance_metrics',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'endpoint',
            type: 'varchar',
          },
          {
            name: 'method',
            type: 'varchar',
          },
          {
            name: 'responseTime',
            type: 'int',
          },
          {
            name: 'statusCode',
            type: 'int',
          },
          {
            name: 'userAgent',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'clientIp',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'requestBody',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'responseBody',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'additionalMetrics',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create Conversation History table
    await queryRunner.createTable(
      new Table({
        name: 'conversation_history',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'configId',
            type: 'uuid',
          },
          {
            name: 'sessionId',
            type: 'varchar',
          },
          {
            name: 'userMessage',
            type: 'text',
          },
          {
            name: 'assistantResponse',
            type: 'text',
          },
          {
            name: 'context',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'responseTime',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'tokenCount',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['configId'],
            referencedTableName: 'ai_configurations',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indexes for better performance
    await queryRunner.createIndex(
      'ai_configurations',
      new TableIndex({
        name: 'IDX_ai_configurations_is_active',
        columnNames: ['isActive'],
      }),
    );

    await queryRunner.createIndex(
      'performance_metrics',
      new TableIndex({
        name: 'IDX_performance_metrics_created_at',
        columnNames: ['createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'performance_metrics',
      new TableIndex({
        name: 'IDX_performance_metrics_endpoint_method',
        columnNames: ['endpoint', 'method'],
      }),
    );

    await queryRunner.createIndex(
      'conversation_history',
      new TableIndex({
        name: 'IDX_conversation_history_session_id',
        columnNames: ['sessionId'],
      }),
    );

    await queryRunner.createIndex(
      'conversation_history',
      new TableIndex({
        name: 'IDX_conversation_history_config_id',
        columnNames: ['configId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('conversation_history');
    await queryRunner.dropTable('performance_metrics');
    await queryRunner.dropTable('ai_configurations');
  }
}
