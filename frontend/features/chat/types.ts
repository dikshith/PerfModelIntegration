export interface Message {
  id?: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  sessionId?: string
}

export interface ChatSession {
  id: string
  createdAt: string
  lastMessageAt: string
  messageCount: number
}

export interface ChatHistory {
  sessionId: string
  messages: Message[]
}

export interface KnowledgeBase {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: string
  status: 'processing' | 'ready' | 'error'
}

export interface KnowledgeBaseResponse {
  data: KnowledgeBase[]
  total: number
}

export interface SendMessageResponse {
  message: Message
  sessionId: string
}

export interface ChatAnalytics {
  totalMessages: number
  averageResponseTime: number
  topQuestions: string[]
  commonTopics: { topic: string; count: number }[]
}

export interface ChatAnomalies {
  anomalies: {
    timestamp: string
    type: string
    description: string
    severity: 'low' | 'medium' | 'high'
  }[]
} 