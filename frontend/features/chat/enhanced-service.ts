// Enhanced chat service that can route to local Ollama or backend
import axiosInstance from '@/lib/api/axios'
import { API_ENDPOINTS } from '@/lib/constants/endpoints'
import { ollamaService } from '@/lib/services/ollama.service'
import { ChatAnalytics, ChatAnomalies, ChatHistory, ChatSession, KnowledgeBase, KnowledgeBaseResponse, SendMessageResponse } from './types'

interface AIConfiguration {
  id: string
  name: string
  modelProvider: string
  modelName: string
  systemPrompt: string
  temperature: number
  maxTokens: number
  topP: number
  baseUrl?: string
  apiKey?: string
  isActive: boolean
}

export const enhancedChatService = {
  // Get the active configuration to determine routing
  getActiveConfiguration: async (): Promise<AIConfiguration | null> => {
    try {
      const response = await axiosInstance.get('/config/active')
      return response.data.success ? response.data.data : null
    } catch (error) {
      console.error('Failed to get active configuration:', error)
      return null
    }
  },

  // Send message with intelligent routing
  sendMessage: async (message: string, sessionId?: string, ragMode?: boolean): Promise<SendMessageResponse> => {
    // Always ensure a client-provided sessionId to allow polling fallback
    const ensuredSessionId = sessionId || `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    // If RAG mode is enabled, always use backend regardless of provider
    if (ragMode) {
      console.log('RAG mode enabled, routing to backend for knowledge base access')
      return await enhancedChatService.sendMessageToBackend(message, ensuredSessionId, ragMode)
    }

    // Get active configuration to determine routing
    const activeConfig = await enhancedChatService.getActiveConfiguration()
    
    if (activeConfig?.modelProvider === 'ollama') {
      // Route to local Ollama
      return await enhancedChatService.sendMessageToOllama(message, activeConfig, ensuredSessionId)
    } else {
      // Route to backend (OpenAI, etc.)
      return await enhancedChatService.sendMessageToBackend(message, ensuredSessionId, ragMode)
    }
  },

  // Send message to user's local Ollama
  sendMessageToOllama: async (
    message: string, 
    config: AIConfiguration, 
    sessionId?: string
  ): Promise<SendMessageResponse> => {
    try {
      const status = await ollamaService.checkStatus()
      if (!status.isRunning) {
        console.log('Local Ollama not accessible, falling back to backend proxy')
        return await enhancedChatService.sendMessageToBackend(message, sessionId, false)
      }

      const isAvailable = await ollamaService.isModelAvailable(config.modelName)
      if (!isAvailable) {
        console.warn(`Ollama model "${config.modelName}" not found locally; falling back to backend.`)
        return await enhancedChatService.sendMessageToBackend(message, sessionId, false)
      }

      // Build prompt including prior conversation if we have a session
      let conversationContext = ''
      const currentSessionId = sessionId || `ollama-session-${Date.now()}`
      try {
        const historyRes = await axiosInstance.get(API_ENDPOINTS.CHAT.HISTORY(currentSessionId))
        const backendData = historyRes.data
        const records = (backendData.success ? backendData.data : backendData) as Array<any>
        if (Array.isArray(records) && records.length > 0) {
          conversationContext = '\n\nPrevious conversation:\n'
          records.forEach((entry: any) => {
            conversationContext += `\nUser: ${entry.userMessage}\nAssistant: ${entry.assistantResponse}\n`
          })
          conversationContext += '\nCurrent user message:\n'
        }
      } catch (e) {
        console.warn('Failed to load conversation history for local prompt context:', e)
      }

      const fullPrompt = (config.systemPrompt ? `${config.systemPrompt}\n\n` : '') + conversationContext + `User: ${message}\nAssistant:`

      let ollamaUrl = config.baseUrl || 'http://localhost:11434'
      if (ollamaUrl.includes('pagekite.me') && ollamaUrl.startsWith('http://')) {
        ollamaUrl = ollamaUrl.replace('http://', 'https://')
      }
      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'omit',
        body: JSON.stringify({
          model: config.modelName,
          prompt: fullPrompt,
          options: {
            temperature: config.temperature,
            top_p: config.topP,
            num_predict: config.maxTokens,
          },
          stream: false,
        }),
      })

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Persist the conversation to backend via dedicated endpoint
      try {
        await axiosInstance.post(API_ENDPOINTS.CHAT.SAVE_HISTORY, {
          sessionId: currentSessionId,
          userMessage: message,
          assistantResponse: data.response,
          model: `ollama:${config.modelName}`,
          configId: config.id,
        })
      } catch (error) {
        console.warn('Failed to save conversation via save endpoint:', error)
      }

      return {
        message: {
          role: 'assistant' as const,
          content: data.response,
          timestamp: new Date().toISOString(),
          sessionId: currentSessionId
        },
        sessionId: currentSessionId
      }
    } catch (error) {
      console.error('Error sending message to Ollama:', error)
      // Fallback on any error
      return await enhancedChatService.sendMessageToBackend(message, sessionId, false)
    }
  },

  // Send message to backend (for OpenAI, etc.)
  sendMessageToBackend: async (
    message: string, 
    sessionId?: string, 
    ragMode?: boolean
  ): Promise<SendMessageResponse> => {
    const payload: any = { message }
    if (sessionId) payload.sessionId = sessionId
    if (ragMode !== undefined) payload.ragMode = ragMode
    
    console.log('Frontend service: Sending payload to backend:', payload)

    try {
      const response = await axiosInstance.post(API_ENDPOINTS.CHAT.MESSAGE, payload)
      const backendData = response.data
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
    } catch (err: any) {
      // Heroku router has a 30s timeout; the backend may finish and save history after the client sees a network error
      console.warn('Backend POST failed, attempting history polling fallback...', err?.message || err)
      if (!sessionId) throw err

      // Poll conversation history for up to ~45s
      const start = Date.now()
      const pollDelay = (ms: number) => new Promise(res => setTimeout(res, ms))
      let lastCount = 0
      while (Date.now() - start < 45000) {
        try {
          const res = await axiosInstance.get(API_ENDPOINTS.CHAT.HISTORY(sessionId))
          const backendData = res.data
          const records = (backendData.success ? backendData.data : backendData) as Array<any>
          if (Array.isArray(records) && records.length > 0) {
            // Find the latest assistant message
            const last = records[records.length - 1]
            if (last && last.assistantResponse && records.length !== lastCount) {
              return {
                message: {
                  role: 'assistant',
                  content: last.assistantResponse,
                  timestamp: last.createdAt || new Date().toISOString(),
                  sessionId
                },
                sessionId
              }
            }
            lastCount = records.length
          }
        } catch {}
        await pollDelay(3000)
      }
      throw err
    }
  },

  // Existing methods from original service
  getChatHistory: async (sessionId: string): Promise<ChatHistory> => {
    console.log('Service: Getting chat history for sessionId:', sessionId)
    const response = await axiosInstance.get(API_ENDPOINTS.CHAT.HISTORY(sessionId))
    console.log('Service: Chat history response:', response.data)
    
    const backendData = response.data
    const records = (backendData.success ? backendData.data : backendData) as Array<any>
    
    if (!Array.isArray(records)) {
      console.log('No records found or invalid format, returning empty chat')
      return { sessionId, messages: [] }
    }
    
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
    const backendData = response.data
    return backendData.success ? backendData.data : backendData
  },

  getKnowledgeBase: async (): Promise<KnowledgeBaseResponse> => {
    const response = await axiosInstance.get(API_ENDPOINTS.CHAT.KNOWLEDGE)
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
