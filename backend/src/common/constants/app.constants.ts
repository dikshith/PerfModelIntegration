export const APP_CONSTANTS = {
  // Application
  DEFAULT_PORT: 3000,
  API_PREFIX: 'api',
  API_VERSION: 'v1',
  
  // Swagger
  SWAGGER_TITLE: 'Generative AI Backend API',
  SWAGGER_DESCRIPTION: 'Clean, organized NestJS backend for Generative AI system with LLM configuration, chatbot with RAG, and performance reporting',
  SWAGGER_VERSION: '1.0',
  SWAGGER_PATH: 'api-docs',

  // Rate Limiting
  DEFAULT_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  DEFAULT_RATE_LIMIT_MAX_REQUESTS: 100,

  // Performance
  DEFAULT_METRICS_RETENTION_DAYS: 30,
  MAX_METRICS_QUERY_LIMIT: 1000,

  // Health Check
  HEALTH_CHECK_TIMEOUT: 5000,
  CRITICAL_ERROR_RATE_THRESHOLD: 10,
  WARNING_ERROR_RATE_THRESHOLD: 5,
  CRITICAL_RESPONSE_TIME_THRESHOLD: 5000,
  WARNING_RESPONSE_TIME_THRESHOLD: 2000,

  // Database
  MIGRATION_TABLE_NAME: 'typeorm_migrations',
  
  // Files
  MAX_FILE_SIZE: '10mb',
  UPLOAD_DIRECTORY: 'uploads',
};

export const AI_CONSTANTS = {
  // Default AI Configuration
  DEFAULT_SYSTEM_PROMPT: 'You are a performance analysis agent for healthcare systems.',
  DEFAULT_TEMPERATURE: 0.3,
  DEFAULT_MAX_TOKENS: 1024,
  DEFAULT_TOP_P: 1.0,
  DEFAULT_FREQUENCY_PENALTY: 0,
  DEFAULT_PRESENCE_PENALTY: 0,

  // Model Providers
  OPENAI_DEFAULT_MODEL: 'gpt-3.5-turbo',
  OLLAMA_DEFAULT_MODEL: 'llama2',
  OLLAMA_DEFAULT_BASE_URL: 'http://localhost:11434',

  // Validation Limits
  MIN_TEMPERATURE: 0,
  MAX_TEMPERATURE: 2,
  MIN_TOKENS: 1,
  MAX_TOKENS: 32000,
  MIN_TOP_P: 0,
  MAX_TOP_P: 1,
  MIN_PENALTY: -2,
  MAX_PENALTY: 2,

  // Prompt Types
  PROMPT_TYPES: {
    PERFORMANCE_SUMMARY: 'performance_summary',
    ANOMALY_DETECTION: 'anomaly_detection',
    CHECKLIST_GENERATION: 'checklist_generation',
    CONFIG_CHANGE_IMPACT: 'config_change_impact',
    GENERAL_CHAT: 'general_chat',
  },
};

export const ERROR_MESSAGES = {
  // AI Configuration
  CONFIG_NOT_FOUND: 'AI Configuration not found',
  NO_ACTIVE_CONFIG: 'No active AI configuration found',
  CONFIG_TEST_FAILED: 'Configuration test failed',
  
  // API Keys
  OPENAI_KEY_MISSING: 'OpenAI API key not provided',
  INVALID_API_KEY: 'Invalid API key provided',
  
  // Chat
  CHAT_PROCESSING_FAILED: 'Failed to process chat message',
  SESSION_NOT_FOUND: 'Chat session not found',
  
  // Performance
  METRICS_GENERATION_FAILED: 'Failed to generate performance metrics',
  HEALTH_CHECK_FAILED: 'Health check failed',
  
  // General
  VALIDATION_FAILED: 'Validation failed',
  INTERNAL_SERVER_ERROR: 'Internal server error occurred',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden access',
};

export const SUCCESS_MESSAGES = {
  CONFIG_CREATED: 'AI Configuration created successfully',
  CONFIG_UPDATED: 'AI Configuration updated successfully',
  CONFIG_DELETED: 'AI Configuration deleted successfully',
  CONFIG_ACTIVATED: 'AI Configuration activated successfully',
  CONFIG_TEST_PASSED: 'Configuration test passed successfully',
  
  CONVERSATION_DELETED: 'Conversation history deleted successfully',
  METRICS_CLEANED: 'Old metrics cleaned successfully',
  
  OPERATION_COMPLETED: 'Operation completed successfully',
};

export const RESPONSE_TIME_BUCKETS = {
  VERY_FAST: { min: 0, max: 100, label: '0-100ms' },
  FAST: { min: 100, max: 500, label: '100-500ms' },
  MEDIUM: { min: 500, max: 1000, label: '500ms-1s' },
  SLOW: { min: 1000, max: 5000, label: '1s-5s' },
  VERY_SLOW: { min: 5000, max: Infinity, label: '5s+' },
};
