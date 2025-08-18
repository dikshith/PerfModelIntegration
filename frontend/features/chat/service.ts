import axiosInstance from '@/lib/api/axios'
import { API_ENDPOINTS } from '@/lib/constants/endpoints'
import { ChatAnalytics, ChatAnomalies, ChatHistory, ChatSession, KnowledgeBase, KnowledgeBaseResponse, SendMessageResponse } from './types'

export const chatService = {
  sendMessage: async (message: string, sessionId?: string, ragMode?: boolean): Promise<SendMessageResponse> => {
    const payload: any = { message }
    if (sessionId) {
      payload.sessionId = sessionId
    }
    // Always include ragMode if it's provided (even if false)
    if (ragMode !== undefined) {
      payload.ragMode = ragMode
    }
    
    console.log('Frontend service: Sending payload:', payload, 'ragMode:', ragMode);
    
    const response = await axiosInstance.post(API_ENDPOINTS.CHAT.MESSAGE, payload)
    // Transform backend response to match frontend expectations
    const backendData = response.data
    console.log('Backend response:', backendData)
    
    // Handle the wrapped response structure
    const actualData = backendData.success ? backendData.data : backendData
    
    return {
      message: {
        role: 'assistant' as const,
        content: actualData.response,
        timestamp: new Date().toISOString(),
        sessionId: actualData.sessionId
      },
      sessionId: actualData.sessionId
    }
  },

  getChatHistory: async (sessionId: string): Promise<ChatHistory> => {
    console.log('Service: Getting chat history for sessionId:', sessionId)
    const response = await axiosInstance.get(API_ENDPOINTS.CHAT.HISTORY(sessionId))
    console.log('Service: Chat history response:', response.data)
    
    // Handle the wrapped response structure
    const backendData = response.data
    const records = (backendData.success ? backendData.data : backendData) as Array<any>
    
    // Handle empty or null records
    if (!Array.isArray(records)) {
      console.log('No records found or invalid format, returning empty chat')
      return { sessionId, messages: [] }
    }
    
    // Flatten each conversation record into separate user and assistant messages
    const messages: ChatHistory['messages'] = records.flatMap((entry: any) => [
      { id: `${entry.id}-user`, role: 'user' as const, content: entry.userMessage, timestamp: entry.createdAt, sessionId },
      { id: `${entry.id}-assistant`, role: 'assistant' as const, content: entry.assistantResponse, timestamp: entry.createdAt, sessionId }
    ])
    
    console.log('Service: Processed messages:', messages)
    return { sessionId, messages }
  },

  getChatSessions: async (): Promise<ChatSession[]> => {
    const response = await axiosInstance.get(API_ENDPOINTS.CHAT.SESSIONS)
    return response.data
  },

  deleteHistory: async (sessionId: string): Promise<void> => {
    await axiosInstance.delete(API_ENDPOINTS.CHAT.DELETE_HISTORY(sessionId))
  },

  getAnalytics: async (): Promise<ChatAnalytics> => {
    const response = await axiosInstance.get(API_ENDPOINTS.CHAT.ANALYZE)
    return response.data
  },

  getAnomalies: async (): Promise<ChatAnomalies> => {
    const response = await axiosInstance.get(API_ENDPOINTS.CHAT.ANOMALIES)
    return response.data
  },

  uploadKnowledge: async (file: File): Promise<KnowledgeBase> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await axiosInstance.post(API_ENDPOINTS.CHAT.UPLOAD_KNOWLEDGE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    // Handle the wrapped response structure
    const backendData = response.data
    return backendData.success ? backendData.data : backendData
  },

  getKnowledgeBase: async (): Promise<KnowledgeBaseResponse> => {
    const response = await axiosInstance.get(API_ENDPOINTS.CHAT.KNOWLEDGE)
    // Handle the wrapped response structure
    const backendData = response.data
    return backendData.success ? backendData.data : backendData
  },

  deleteKnowledge: async (id: string): Promise<void> => {
    await axiosInstance.delete(API_ENDPOINTS.CHAT.KNOWLEDGE_BY_ID(id))
  },

  clearKnowledge: async (): Promise<void> => {
    await axiosInstance.post(API_ENDPOINTS.CHAT.CLEAR_KNOWLEDGE)
  }
}