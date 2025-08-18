# Backend Deep Dive: NestJS Architecture & Implementation

## 🏗 Overview

The backend is built using **NestJS**, a progressive Node.js framework that leverages TypeScript decorators and dependency injection to create scalable server-side applications. This implementation provides a robust foundation for AI integration, RAG (Retrieval Augmented Generation), and performance analytics.

## Key updates in this codebase
- Multi-provider AI with smart defaults: chooses OpenAI if OPENAI_API_KEY is present; otherwise uses Ollama when OLLAMA_BASE_URL is configured.
- PageKite/Tunnel-aware Ollama client: auto-upgrades http→https for *.pagekite.me URLs and sets proper Host header.
- Server-side RAG with PDF parsing: uploads are persisted to disk, parsed (pdf-parse), chunked, and reloaded on startup.
- Reliable chat history: all messages (including fallbacks) are persisted; foreign key on conversation history uses onDelete: SET NULL to avoid delete errors.
- Defensive chat flow: early guard and extractive fallback when generation isn’t possible (unreachable provider or missing model) so users still get cited excerpts.

## 🎯 Core Architecture

### Framework Choice: NestJS
**Why NestJS?**
- **Decorator-based Architecture**: Clean, declarative code using TypeScript decorators
- **Dependency Injection**: Built-in IoC container for better testability and modularity
- **Module System**: Organized code structure with feature modules
- **Express/Fastify Support**: Can use either HTTP platform
- **Built-in Validation**: Class-validator integration for request validation
- **Auto-generated Documentation**: Swagger integration out-of-the-box
- **TypeScript First**: Full TypeScript support with strong typing

### Project Structure Deep Analysis

```
backend/src/
├── app.module.ts           # Root application module
├── main.ts                 # Application bootstrap
├── serverless.ts           # Serverless entry point (Vercel)
├── minimal.ts              # Minimal server for testing
├── common/                 # Shared utilities and constants
├── config/                 # Configuration management
├── controllers/            # HTTP request handlers
├── database/               # Database configuration and migrations
├── dto/                    # Data Transfer Objects
├── entities/               # TypeORM database entities
├── middleware/             # Custom middleware
├── modules/                # Feature-based modules
├── services/               # Business logic layer
└── utils/                  # Helper functions
```

## 🔧 Technology Stack Deep Dive

### 1. TypeScript Configuration

**tsconfig.json Analysis:**
```json
{
  "compilerOptions": {
    "module": "commonjs",           // CommonJS for Node.js compatibility
    "declaration": true,            // Generate .d.ts files
    "removeComments": true,         // Clean compiled output
    "emitDecoratorMetadata": true,  // Required for NestJS decorators
    "experimentalDecorators": true, // Enable decorator support
    "allowSyntheticDefaultImports": true,
    "target": "ES2020",            // Modern JavaScript features
    "sourceMap": true,             // Debugging support
    "outDir": "./dist",            // Compiled output directory
    "baseUrl": "./",               // Base for relative imports
    "incremental": true,           // Faster compilation
    "skipLibCheck": true,          // Skip type checking of declaration files
    "strictNullChecks": false,     // Relaxed null checking
    "noImplicitAny": false,        // Allows implicit any types
    "strictBindCallApply": false,  // Relaxed function binding
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  }
}
```

### 2. Database Layer: TypeORM

**Why TypeORM?**
- **Decorator-based Entities**: Clean entity definitions using decorators
- **Migration Support**: Database schema versioning and evolution
- **Multi-database Support**: SQLite for development, PostgreSQL for production
- **Repository Pattern**: Clean data access layer
- **Query Builder**: Type-safe query construction
- **Connection Management**: Automatic connection pooling

**Entity Architecture:**

```typescript
// Example: ConversationHistory Entity
@Entity()
export class ConversationHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sessionId: string;          // Chat session identifier

  @Column()
  role: string;              // 'user' or 'assistant'

  @Column('text')
  content: string;           // Message content

  @Column()
  timestamp: Date;           // Message timestamp

  @Column({ nullable: true })
  ragUsed: boolean;          // Whether RAG was used

  @Column('json', { nullable: true })
  metadata: any;             // Additional metadata

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Database Configuration:**

```typescript
// database/database.config.ts
export const databaseConfig = (): TypeOrmModuleOptions => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  if (isDevelopment) {
    // SQLite for local development
    return {
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
      synchronize: true,        // Auto-sync schema in development
      logging: true,           // SQL query logging
    };
  } else {
    // PostgreSQL for production
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      synchronize: false,      // Never auto-sync in production
      logging: false,          // Disable logging in production
      ssl: {
        rejectUnauthorized: false, // Required for Heroku PostgreSQL
      },
    };
  }
};
```

### 3. Logging System: Winston

**Advanced Logging Configuration:**

```typescript
// utils/logger.ts
import * as winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ai-chat-backend' },
  transports: [
    // Error log - only errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log - all levels
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}
```

### 4. Validation & DTOs

**Data Transfer Objects with Validation:**

```typescript
// dto/create-message.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({
    description: 'The message content from the user',
    example: 'Hello, how can you help me today?'
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Session ID for conversation continuity',
    example: 'session-123-456-789',
    required: false
  })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiProperty({
    description: 'Whether to use RAG for enhanced responses',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  ragMode?: boolean;
}
```

**Validation Pipeline:**

```typescript
// Global validation pipe configuration
app.useGlobalPipes(new ValidationPipe({
  transform: true,           // Auto-transform payloads to DTO instances
  whitelist: true,           // Remove non-whitelisted properties
  forbidNonWhitelisted: true, // Throw error for non-whitelisted properties
  disableErrorMessages: process.env.NODE_ENV === 'production',
}));
```

## 🤖 AI Integration Architecture

### 1. Multi-Provider AI System (OpenAI + Ollama)
- Default provider selection:
  - If process.env.OPENAI_API_KEY is set, default to provider=openai.
  - Else if process.env.OLLAMA_BASE_URL is set, default to provider=ollama and use that base URL.
  - Never assume OpenAI in production without a key.
- Ollama over PageKite:
  - If the base URL is a PageKite link (e.g., http://name.pagekite.me), the AI service upgrades to https and includes the Host header expected by the tunnel.
  - Timeouts and errors are logged with actionable messages.
- Safe fallback:
  - If Ollama generation fails and OpenAI key exists, it can fall back to OpenAI.

### 2. RAG (Retrieval Augmented Generation)
- Upload pipeline:
  - Files are saved under backend/uploads and parsed (txt/md directly; PDFs via pdf-parse).
  - Parsed text is chunked and indexed in-memory; the index is rebuilt on startup by scanning uploads/.
- Retrieval:
  - Token/length-aware chunking and scoring; top-k chunks assembled as context with source citations.
  - Prompt instructs the model to use only provided context and include citations.
- Extractive fallback:
  - If generation can’t run (e.g., ragMode + provider unreachable), returns top document excerpts with citations and persists them as the assistant reply.

### 3. Chat Flow Resilience
- Always persists history: user + assistant messages, including fallback answers, with metadata flags like ragModeUsed and model.
- Early guard for unreachable local providers:
  - If ragMode is requested while provider=ollama and baseUrl points to localhost (or an unexposed host) in production, the service skips generation and provides extractive fallback with citations.
- Max token caps in ragMode to keep responses concise and reliably generated.

## 🗄 Database Layer: TypeORM

**Why TypeORM?**
- **Decorator-based Entities**: Clean entity definitions using decorators
- **Migration Support**: Database schema versioning and evolution
- **Multi-database Support**: SQLite for development, PostgreSQL for production
- **Repository Pattern**: Clean data access layer
- **Query Builder**: Type-safe query construction
- **Connection Management**: Automatic connection pooling

**Entity Architecture:**

```typescript
// Example: ConversationHistory Entity
@Entity()
export class ConversationHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sessionId: string;          // Chat session identifier

  @Column()
  role: string;              // 'user' or 'assistant'

  @Column('text')
  content: string;           // Message content

  @Column()
  timestamp: Date;           // Message timestamp

  @Column({ nullable: true })
  ragUsed: boolean;          // Whether RAG was used

  @Column('json', { nullable: true })
  metadata: any;             // Additional metadata

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Database Configuration:**

```typescript
// database/database.config.ts
export const databaseConfig = (): TypeOrmModuleOptions => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  if (isDevelopment) {
    // SQLite for local development
    return {
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
      synchronize: true,        // Auto-sync schema in development
      logging: true,           // SQL query logging
    };
  } else {
    // PostgreSQL for production
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      synchronize: false,      // Never auto-sync in production
      logging: false,          // Disable logging in production
      ssl: {
        rejectUnauthorized: false, // Required for Heroku PostgreSQL
      },
    };
  }
};
```

### ConversationHistory FK fix
- The ConversationHistory → AIConfiguration relation uses onDelete: SET NULL to prevent 500s when deleting configurations that are referenced by history.

## 📊 Performance & Reports
- Endpoints expose metrics and generate AI-assisted reports.
- If AI generation isn’t available, the service returns a deterministic basic report (health score, KPIs, trends) so the UI always has data.

## 🛡 Security & CORS
- CORS allows Vercel frontend in production; dev allows all origins.
- Helmet is enabled with CSP and HSTS.

## 🚀 Deployment notes
- Heroku dynos cannot reach localhost; use PageKite (or any public tunnel) for Ollama and set OLLAMA_BASE_URL=https://<subdomain>.pagekite.me.
- Heroku ephemeral filesystem: re-upload documents after deploy/restart (uploads are not persistent). Consider external storage if persistence is needed.

This comprehensive backend architecture provides a robust, scalable, and maintainable foundation for the AI chat system, leveraging modern TypeScript patterns and NestJS best practices.
