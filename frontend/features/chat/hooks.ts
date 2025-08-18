import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { enhancedChatService } from './enhanced-service'
import { toast } from 'sonner'
import { MESSAGES } from '@/lib/constants/messages'

export const useChatHistory = (sessionId: string) => {
  return useQuery({
    queryKey: ['chatHistory', sessionId],
    queryFn: () => {
      if (!sessionId) throw new Error('Session ID is required')
      console.log('Hook: Fetching chat history for sessionId:', sessionId)
      return enhancedChatService.getChatHistory(sessionId)
    },
    enabled: !!sessionId,
    retry: 1, // Only retry once to avoid infinite loops
  })
}

export const useChatSessions = () => {
  return useQuery({
    queryKey: ['chatSessions'],
    queryFn: enhancedChatService.getChatSessions
  })
}

export const useSendMessage = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ message, sessionId, ragMode }: { message: string; sessionId?: string; ragMode?: boolean }) => 
      enhancedChatService.sendMessage(message, sessionId, ragMode),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['chatHistory', data.sessionId] })
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] })
      toast.success(MESSAGES.SUCCESS.CHAT.SEND)
    },
    onError: (error: any) => {
      console.error('Chat error:', error)
      toast.error(error.message || MESSAGES.ERROR.CHAT.SEND)
    }
  })
}

export const useDeleteHistory = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: enhancedChatService.deleteHistory,
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['chatHistory', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] })
      toast.success(MESSAGES.SUCCESS.CHAT.DELETE)
    },
    onError: () => {
      toast.error(MESSAGES.ERROR.CHAT.DELETE)
    }
  })
}

export const useChatAnalytics = () => {
  return useQuery({
    queryKey: ['chatAnalytics'],
    queryFn: enhancedChatService.getAnalytics
  })
}

export const useChatAnomalies = () => {
  return useQuery({
    queryKey: ['chatAnomalies'],
    queryFn: enhancedChatService.getAnomalies
  })
}

export const useKnowledgeBase = () => {
  return useQuery({
    queryKey: ['knowledgeBase'],
    queryFn: enhancedChatService.getKnowledgeBase
  })
}

export const useUploadKnowledge = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: enhancedChatService.uploadKnowledge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBase'] })
      toast.success(MESSAGES.SUCCESS.CHAT.UPLOAD_KNOWLEDGE)
    },
    onError: () => {
      toast.error(MESSAGES.ERROR.CHAT.UPLOAD_KNOWLEDGE)
    }
  })
}

export const useDeleteKnowledge = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: enhancedChatService.deleteKnowledge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBase'] })
      toast.success(MESSAGES.SUCCESS.CHAT.DELETE_KNOWLEDGE)
    },
    onError: () => {
      toast.error(MESSAGES.ERROR.CHAT.DELETE_KNOWLEDGE)
    }
  })
}

export const useClearKnowledge = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: enhancedChatService.clearKnowledge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBase'] })
      toast.success(MESSAGES.SUCCESS.CHAT.CLEAR_KNOWLEDGE)
    },
    onError: () => {
      toast.error(MESSAGES.ERROR.CHAT.CLEAR_KNOWLEDGE)
    }
  })
} 