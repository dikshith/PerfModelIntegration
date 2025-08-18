# Backend Setup Guide: Building an AI Chat System from Scratch

## What’s different in this repo
- Multi-provider AI (OpenAI/Ollama) with smart defaults.
- PageKite-aware Ollama client for production.
- Server-side RAG with PDF parsing and citations.
- Reliable chat history and FK delete fix.

## Quick start (local)
1) Install deps: npm install
2) Env (create .env or configure env vars):
   - NODE_ENV=development
   - OPENAI_API_KEY=... (optional)
   - OLLAMA_BASE_URL=http://localhost:11434 (if using local Ollama)
3) Start dev server: npm run start:dev
4) Health check: GET http://localhost:3001/api/health

## Using Ollama through PageKite (production)
- Heroku cannot reach localhost; expose your local Ollama via PageKite and set on Heroku:
  - OLLAMA_BASE_URL=https://<your-subdomain>.pagekite.me
- The backend auto-upgrades http→https and adds Host header for PageKite; it prechecks `/api/version` to avoid router timeouts.
- Ensure the Ollama model exists on the machine behind the tunnel.

## RAG uploads
- Files are saved to backend/uploads and parsed; index is built at startup.
- On Heroku, uploads are ephemeral—re-upload after each deploy or use external storage.

## Environment variables (backend)
- PORT (default 3001)
- DATABASE_URL (Postgres in production)
- USE_SQLITE=true|false (force SQLite; default true if DATABASE_URL is missing)
- DB_SYNC=true|false (controls Postgres synchronize; default true)
- OPENAI_API_KEY (if using OpenAI)
- OLLAMA_BASE_URL (if using Ollama)
- ALLOW_RAG_IN_PROD=true|false (default false; RAG disabled in production unless true)
- CORS_ORIGIN / FRONTEND_URL (additional allowed origins; *.vercel.app is allowed by regex)

## Deploying to Heroku (summary)
- Add Postgres add-on; set DATABASE_URL.
- Set NODE_ENV=production.
- Set OPENAI_API_KEY or OLLAMA_BASE_URL (PageKite HTTPS URL).
- Optionally set ALLOW_RAG_IN_PROD=true to enable RAG online.
- Push and scale web dyno.

See docs/production-deployment.md and docs/pagekite-setup.md for full details.

## 🎯 Overview

This guide walks you through recreating the entire backend system from the ground up. We'll build a sophisticated AI chat platform with RAG capabilities, performance analytics, and multi-provider AI integration using NestJS, TypeScript, and modern development practices.

## 🏗 Project Foundation

### 1. Initialize the NestJS Project

Start by creating a new NestJS project with the CLI:

```bash
npm i -g @nestjs/cli
nest new ai-chat-backend
cd ai-chat-backend
```

The NestJS CLI generates a clean project structure with TypeScript configuration, testing setup, and basic module architecture. This gives us a solid foundation with dependency injection, decorators, and modular design patterns.

### 2. Configure TypeScript for Advanced Features

Update `tsconfig.json` to enable experimental decorators and strict type checking:

- Enable `experimentalDecorators` and `emitDecoratorMetadata` for TypeORM entities
- Set `strict: true` for comprehensive type safety  
- Configure path mapping for clean imports (`@/` prefix)
- Enable `esModuleInterop` for better library compatibility

This configuration ensures we can use TypeORM decorators, maintain type safety throughout the application, and have clean import statements that improve code readability.

### 3. Install Core Dependencies

The system requires several key packages:

**Database & ORM:**
- `typeorm` - Object-relational mapping with decorator support
- `@nestjs/typeorm` - NestJS TypeORM integration
- `sqlite3` - Development database (lightweight, file-based)
- `pg` - PostgreSQL driver for production

**AI Integration:**
- `openai` - Official OpenAI SDK for GPT models
- `axios` - HTTP client for Ollama API calls

**Utilities:**
- `winston` - Advanced logging with multiple transports
- `multer` - File upload handling for document RAG
- `helmet` - Security middleware for HTTP headers
- `class-validator` - DTO validation decorators

Each dependency serves a specific architectural purpose. TypeORM provides the database abstraction layer, Winston enables comprehensive logging, and the AI SDKs allow multi-provider support.

## 🗄 Database Architecture

### Entity Design Philosophy

The database schema follows domain-driven design principles with clear entity relationships:

**AI Configuration Entity:**
- Stores provider settings (OpenAI vs Ollama)
- Model parameters (temperature, max tokens)
- API credentials and endpoints
- Provider-specific configurations

**Chat Session Entity:**
- Unique session identifiers for conversation persistence
- Creation timestamps and metadata  
- Session-based message grouping
- User session management

**Message Entity:**
- Role-based message system (user/assistant)
- Content storage with proper indexing
- Timestamp tracking for chronological ordering
- Session relationship for conversation threading

**Knowledge Base Entity:**
- Document storage for RAG functionality
- File metadata (name, type, size)
- Processed content for semantic search
- Upload tracking and management

**Performance Metrics Entity:**
- API response time tracking
- Error rate monitoring  
- Request volume analytics
- System health indicators

### Database Connection Strategy

The system uses a flexible database configuration that adapts to the environment:

**Development Mode:**
- SQLite for rapid development cycles
- File-based storage for portability
- No external database dependencies
- Easy data inspection and debugging

**Production Mode:**  
- PostgreSQL for scalability and reliability
- Connection pooling for performance
- Environment-based configuration
- Backup and recovery capabilities

The TypeORM configuration automatically detects the environment and adjusts connection parameters, making deployment seamless across different platforms.

### Migration and Schema Management

TypeORM migrations handle database schema evolution:
- Automatic migration generation from entity changes
- Version-controlled schema updates
- Rollback capabilities for safe deployments
- Synchronization options for development

## 🤖 AI Integration Architecture

### Multi-Provider Design Pattern

The AI service layer implements a strategy pattern for multiple AI providers:

**Provider Abstraction:**
- Common interface for all AI providers
- Standardized request/response format
- Error handling consistency
- Configuration management per provider

**OpenAI Implementation:**
- Official SDK integration with proper typing
- Streaming response support for real-time chat
- Token usage tracking and cost management
- Model selection (GPT-3.5-turbo, GPT-4, etc.)

**Ollama Integration:**
- HTTP-based API communication
- Local model hosting support
- Custom model configuration
- Network tunneling for web access (PageKite)

### Request Processing Flow

The chat service orchestrates the entire AI interaction:

1. **Message Reception:** Input validation and sanitization
2. **Context Assembly:** Session history retrieval and formatting
3. **RAG Enhancement:** Optional knowledge base querying
4. **Provider Selection:** Dynamic provider routing based on configuration
5. **AI Processing:** Request dispatch to selected provider
6. **Response Handling:** Stream processing and error management
7. **Persistence:** Message storage and session updating

### RAG (Retrieval Augmented Generation) Implementation

The RAG system enhances AI responses with custom knowledge:

**Document Processing Pipeline:**
- File upload and validation
- Content extraction from various formats
- Text chunking for optimal retrieval
- Metadata preservation for context

**Semantic Search Engine:**
- Multi-level relevance scoring algorithm
- Exact phrase matching with high priority
- Term frequency analysis for ranking
- Partial matching for comprehensive results
- Sentence-level extraction for context preservation

**Context Integration:**
- Relevant passage selection based on query similarity
- Context window management for AI models
- Source attribution for transparency
- Dynamic context assembly per request

The RAG implementation uses a sophisticated scoring system that combines multiple factors: exact phrase matches receive the highest priority, followed by term frequency analysis, and finally partial matching for comprehensive coverage.

## 📊 Performance Analytics System

### Metrics Collection Architecture

The performance system implements comprehensive monitoring:

**Request Tracking:**
- Response time measurement with high precision
- HTTP status code monitoring
- Endpoint usage analytics
- Error pattern detection

**AI-Powered Analysis:**
- Intelligent insight generation from metrics
- Trend analysis and anomaly detection
- Automated health scoring
- Performance recommendations

**Real-time Monitoring:**
- Live metric updates
- Alert thresholds for critical issues  
- Dashboard data streaming
- Historical trend analysis

### Report Generation Engine

The system includes an AI-powered reporting engine:

1. **Data Aggregation:** Metric collection across time periods
2. **Pattern Recognition:** AI analysis of performance trends
3. **Insight Generation:** Automated commentary and recommendations  
4. **Health Scoring:** Comprehensive system health assessment
5. **Actionable Recommendations:** Specific improvement suggestions

## 🔐 Security Implementation

### Multi-Layer Security Architecture

**HTTP Security Headers:**
- Helmet.js integration for comprehensive header management
- CORS configuration for cross-origin protection
- Content Security Policy (CSP) implementation
- XSS and CSRF protection mechanisms

**Input Validation:**
- DTO-based validation using class-validator
- Request sanitization and filtering
- File upload security (type, size restrictions)
- SQL injection prevention through ORM

**API Security:**
- Rate limiting for DDoS protection
- Authentication token validation
- API key management for AI providers
- Request logging for audit trails

## 🚀 Service Architecture

### Modular Design Pattern

The backend follows NestJS modular architecture:

**Core Modules:**
- `AppModule` - Root module with global configuration
- `DatabaseModule` - TypeORM configuration and connection management
- `AIModule` - AI service providers and configuration
- `ChatModule` - Chat functionality and message handling
- `PerformanceModule` - Analytics and monitoring
- `UploadModule` - File handling and RAG document processing

**Service Layer:**
- Business logic encapsulation
- Provider pattern for AI services  
- Repository pattern for data access
- Factory pattern for dynamic provider selection

**Controller Layer:**
- HTTP request handling
- DTO validation and transformation
- Response formatting and error handling
- OpenAPI documentation generation

### Dependency Injection Strategy

NestJS dependency injection enables clean architecture:
- Service decoupling through interfaces
- Testable component design
- Configuration injection for flexibility
- Provider lifecycle management

## 🛠 Development Workflow

### Local Development Setup

**Environment Configuration:**
1. Clone the repository and install dependencies
2. Set up environment variables for AI providers
3. Configure database connection (SQLite for development)
4. Initialize database schema with migrations
5. Start development server with hot reload

**AI Provider Setup:**
- OpenAI: API key configuration in environment variables
- Ollama: Local installation with PageKite tunneling for web access
- Provider switching through configuration without code changes

**Development Tools:**
- Winston logging for debugging and monitoring
- Swagger UI for API testing and documentation
- TypeORM query logging for database debugging
- Hot module replacement for rapid development

### Testing Strategy

**Unit Testing:**
- Service layer testing with mocked dependencies
- Entity validation testing
- Utility function testing
- AI provider integration testing

**Integration Testing:**
- End-to-end API testing
- Database integration testing
- AI provider communication testing
- File upload and RAG testing

**Performance Testing:**
- Load testing for chat endpoints
- Database query optimization testing
- AI response time benchmarking
- Memory usage profiling

## 🌐 Deployment Architecture

### Production Deployment Strategy

**Heroku Deployment:**
- Procfile configuration for process management
- Environment variable management
- PostgreSQL addon integration
- Logging aggregation and monitoring

**Database Migration:**
- Production-safe migration scripts
- Zero-downtime deployment strategy
- Backup and rollback procedures
- Connection pooling optimization

**Monitoring and Alerting:**
- Application performance monitoring
- Error tracking and notification
- Resource usage monitoring
- Custom metric dashboards

## 🔄 API Design Philosophy

### RESTful Architecture

The API follows REST principles with clear resource modeling:
- Noun-based endpoints for resource representation
- HTTP methods for action semantics
- Status codes for response indication
- JSON payload standardization

### OpenAPI Documentation

Swagger integration provides comprehensive API documentation:
- Automatic schema generation from DTOs
- Interactive API explorer
- Request/response examples
- Authentication documentation

## 📈 Scaling Considerations

### Horizontal Scaling Preparation

The architecture supports scaling through:
- Stateless service design
- Database connection pooling
- Caching layer integration points
- Load balancer compatibility

### Performance Optimization

Key optimization strategies:
- Database query optimization with proper indexing
- Connection pooling for database efficiency
- Response caching for frequently accessed data
- Asynchronous processing for heavy operations

## 🎯 Frontend Integration Points

### API Contract Design

The backend provides clean API contracts for frontend consumption:
- Consistent response formats across all endpoints
- Proper HTTP status codes for client handling
- Error message standardization
- Real-time capabilities through appropriate protocols

### State Management Support

Backend design supports modern frontend state management:
- Predictable API responses for client-side caching
- Optimistic update patterns through proper endpoint design
- Real-time updates through WebSocket or Server-Sent Events
- Client-friendly pagination and filtering

This comprehensive guide provides the foundation for recreating the entire backend system, emphasizing architectural decisions, implementation strategies, and best practices for building scalable AI applications.
