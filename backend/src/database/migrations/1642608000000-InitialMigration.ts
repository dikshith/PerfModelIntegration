import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1642608000000 implements MigrationInterface {
  name = 'InitialMigration1642608000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // AI Configurations table
    await queryRunner.query(`
      CREATE TABLE "ai_configurations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "modelProvider" character varying NOT NULL CHECK ("modelProvider" IN ('openai', 'ollama', 'huggingface', 'anthropic')),
        "modelName" character varying NOT NULL,
        "systemPrompt" text NOT NULL DEFAULT 'You are a performance analysis agent for healthcare systems.',
        "temperature" double precision NOT NULL DEFAULT 0.3,
        "maxTokens" integer NOT NULL DEFAULT 1024,
        "topP" double precision NOT NULL DEFAULT 1.0,
        "frequencyPenalty" double precision NOT NULL DEFAULT 0,
        "presencePenalty" double precision NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "apiKey" character varying,
        "baseUrl" character varying,
        "additionalSettings" jsonb DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_ai_configurations_name" UNIQUE ("name"),
        CONSTRAINT "PK_ai_configurations" PRIMARY KEY ("id")
      )
    `);

    // Conversation History table
    await queryRunner.query(`
      CREATE TABLE "conversation_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "configId" uuid NOT NULL,
        "sessionId" character varying NOT NULL,
        "userMessage" character varying NOT NULL,
        "assistantResponse" text NOT NULL,
        "context" character varying,
        "responseTime" integer,
        "tokenCount" integer,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_conversation_history" PRIMARY KEY ("id")
      )
    `);

    // Performance Metrics table
    await queryRunner.query(`
      CREATE TABLE "performance_metrics" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "endpoint" character varying NOT NULL,
        "method" character varying NOT NULL,
        "responseTime" integer NOT NULL,
        "statusCode" integer NOT NULL,
        "userAgent" character varying,
        "clientIp" character varying,
        "requestBody" jsonb,
        "responseBody" jsonb,
        "errorMessage" text,
        "additionalMetrics" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_performance_metrics" PRIMARY KEY ("id")
      )
    `);

    // Foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "conversation_history" 
      ADD CONSTRAINT "FK_conversation_history_configId" 
      FOREIGN KEY ("configId") 
      REFERENCES "ai_configurations"("id") 
      ON DELETE CASCADE
    `);

    // Indexes for better performance
    await queryRunner.query(`CREATE INDEX "IDX_conversation_history_sessionId" ON "conversation_history" ("sessionId")`);
    await queryRunner.query(`CREATE INDEX "IDX_conversation_history_configId" ON "conversation_history" ("configId")`);
    await queryRunner.query(`CREATE INDEX "IDX_performance_metrics_endpoint" ON "performance_metrics" ("endpoint")`);
    await queryRunner.query(`CREATE INDEX "IDX_performance_metrics_createdAt" ON "performance_metrics" ("createdAt")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_performance_metrics_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_performance_metrics_endpoint"`);
    await queryRunner.query(`DROP INDEX "IDX_conversation_history_configId"`);
    await queryRunner.query(`DROP INDEX "IDX_conversation_history_sessionId"`);
    await queryRunner.query(`ALTER TABLE "conversation_history" DROP CONSTRAINT "FK_conversation_history_configId"`);
    await queryRunner.query(`DROP TABLE "performance_metrics"`);
    await queryRunner.query(`DROP TABLE "conversation_history"`);
    await queryRunner.query(`DROP TABLE "ai_configurations"`);
  }
}
