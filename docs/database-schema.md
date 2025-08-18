# Database Schema

This system uses TypeORM with SQLite in development and PostgreSQL in production. Below is a comprehensive, up-to-date description of entities, relations, and operational behavior.

## Engines
- Local: SQLite (default when DATABASE_URL is not set or USE_SQLITE=true).
- Production: Postgres (when DATABASE_URL is provided and USE_SQLITE is not true). SSL enabled in production.
- DB_SYNC=true|false controls TypeORM synchronize for Postgres.

## Entities

### AIConfiguration (`ai_configurations`)
- id (uuid, PK)
- name (string)
- modelProvider (enum: openai | ollama | huggingface | anthropic)
- modelName (string)
- systemPrompt (text, default from app constants)
- temperature (float)
- maxTokens (int)
- topP (float)
- frequencyPenalty (float)
- presencePenalty (float)
- isActive (boolean)
- apiKey (string, nullable)
- baseUrl (string, nullable)
- parameters (text, nullable; raw JSON string)
- additionalSettings (text with JSON transformer → object)
- createdAt, updatedAt (timestamps)
- conversations: OneToMany -> ConversationHistory

Notes
- Only one configuration should be active for general use; the service loads the active config at runtime.
- For Ollama in production, baseUrl must be a public HTTPS tunnel (e.g., PageKite).

### ConversationHistory (`conversation_history`)
- id (uuid, PK)
- configId (uuid, nullable; FK → AIConfiguration.id, onDelete: SET NULL, onUpdate: CASCADE)
- sessionId (string) – groups messages in a chat session
- userMessage (string)
- assistantResponse (text)
- context (string, nullable) – RAG context or metadata
- responseTime (int, ms, nullable)
- tokenCount (int, nullable)
- metadata (json via text transformer) – includes model, temperature, maxTokens, timestamp, ragMode flags, fallbacks, citations, etc.
- createdAt, updatedAt (timestamps)
- aiConfig: ManyToOne -> AIConfiguration

Notes
- FK uses onDelete: SET NULL to prevent errors when deleting configs.
- Every exchange is persisted including fallbacks; ensures cross-page consistency.

### PerformanceMetrics (`performance_metrics`)
- id (uuid, PK)
- endpoint (string)
- method (string)
- responseTime (int, ms)
- statusCode (int)
- userAgent (string, nullable)
- clientIp (string, nullable)
- requestBody (json via text transformer, nullable; sanitized)
- responseBody (json via text transformer, nullable)
- errorMessage (text, nullable)
- metrics (json via text transformer, nullable) – arbitrary extra measures
- metadata (json via text transformer, nullable)
- tags (json via text transformer, nullable; string[])
- createdAt, updatedAt (timestamps)

Notes
- Written asynchronously by PerformanceMiddleware after each request.
- Used for reports, time-series, and anomaly detection.

## Relations
- AIConfiguration 1—* ConversationHistory (nullable FK with SET NULL on delete)
- PerformanceMetrics is standalone (no FK), to keep logging decoupled and resilient.

## Indices & Querying
- Default PK indexes on id.
- For heavy traffic, consider additional indexes in Postgres:
  - idx_perf_created_at (createdAt)
  - idx_perf_endpoint (endpoint)
  - idx_perf_method (method)
  - idx_conv_session (sessionId)
  - idx_conv_created_at (createdAt)

## Data Lifecycle
- Metrics retention: service includes deleteOldMetrics(days) to purge older metrics.
- Conversations: retained by default; can be purged by session or globally via future maintenance tasks.
- AIConfigurations: deleting an active config does not break history due to SET NULL.

## Environment-specific Behavior
- Dev: SQLite file database.sqlite; synchronize may be enabled.
- Prod: PostgreSQL via DATABASE_URL; synchronize disabled; run migrations if added.
- Heroku FS is ephemeral—uploads directory for RAG is not persisted; use external storage if needed.

## RAG Storage & Context
- Uploaded files are saved under backend/uploads and parsed to text (pdf-parse for PDFs). Parsed contents are chunked and loaded into an in-memory index at startup.
- ConversationHistory.context/metadata can hold citations and context slices used for answers.

## Integrity & Security
- Request bodies are sanitized to redact sensitive fields before being stored in metrics.
- Metadata transformers ensure JSON is stored/retrieved safely without runtime errors.

## Example Queries
- Recent session history by sessionId ordered ascending by createdAt.
- Performance report window by createdAt Between(start, end) with aggregations (avg, p90, p99) performed in service layer.

This schema supports reliable chat history, provider configuration, RAG citations, and robust performance analytics suitable for both local and production environments.

## Migrations
- Recommended for Postgres. Disable synchronize (DB_SYNC=false) once migrations are in place.

## Notes
- Heroku dynos have ephemeral disk; uploads and SQLite are not durable. Prefer Postgres and external storage for production.
