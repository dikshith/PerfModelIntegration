export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export const API_ENDPOINTS = {
  CONFIG: {
    BASE: '/config',
    BY_ID: (id: string) => `/config/${id}`,
    ACTIVE: '/config/active',
    ACTIVATE: (id: string) => `/config/${id}/activate`,
    TEST: (id: string) => `/config/${id}/test`,
    OLLAMA_STATUS: '/config/ollama/status', // Added explicit endpoint for server-side Ollama status
  },
  CHAT: {
    MESSAGE: '/chat/message',
    HISTORY: (sessionId: string) => `/chat/conversations/${sessionId}`,
    SESSIONS: '/chat/sessions',
    DELETE_HISTORY: (sessionId: string) => `/chat/history/${sessionId}`,
    ANALYZE: '/chat/analyze',
    ANOMALIES: '/chat/anomalies',
    UPLOAD_KNOWLEDGE: '/chat/upload-knowledge',
    KNOWLEDGE: '/chat/knowledge',
    KNOWLEDGE_BY_ID: (id: string) => `/chat/knowledge/${id}`,
    CLEAR_KNOWLEDGE: '/chat/knowledge/clear',
    SAVE_HISTORY: '/chat/history/save',
  },
  REPORTS: {
    BASE: '/reports',
    GENERATE: '/reports/generate',
    BY_ID: (id: string) => `/reports/${id}`,
    DOWNLOAD: (id: string) => `/reports/${id}/download`,
    SUMMARY: '/reports/summary/current',
    PERFORMANCE: '/reports/performance',
    METRICS: '/reports/metrics',
    HEALTH: '/reports/health',
  }
} as const

export type ApiEndpoints = typeof API_ENDPOINTS