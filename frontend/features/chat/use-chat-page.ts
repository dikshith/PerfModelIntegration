import React, { useState, useEffect } from 'react'
import { useChatHistory, useSendMessage } from './hooks'
import { useActiveConfiguration } from '../ai-config/hooks'
import { Message } from './types'

export function useChatPage() {
  // Load sessionId from localStorage on mount (avoiding SSR issues)
  const [sessionId, setSessionId] = useState<string>('')
  const [isHydrated, setIsHydrated] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [localMessages, setLocalMessages] = useState<Message[]>([])
  const [ragMode, setRagMode] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Enhanced session persistence - load from localStorage and URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // First try to get sessionId from URL params (for direct links)
      const urlParams = new URLSearchParams(window.location.search);
      const urlSessionId = urlParams.get('sessionId');
      
      // Then try localStorage
      const savedSessionId = localStorage.getItem('chatSessionId') || '';
      
      // Use URL session if available, otherwise use saved session
      const finalSessionId = urlSessionId || savedSessionId;
      
      if (finalSessionId && finalSessionId !== sessionId) {
        setSessionId(finalSessionId);
        console.log('Restored session from storage/URL:', finalSessionId);
      }
      
      // Also restore RAG mode preference
      const savedRagMode = localStorage.getItem('chatRagMode') === 'true';
      setRagMode(savedRagMode);
      
      setIsHydrated(true);
      setIsInitialized(true);
    }
  }, []);
  
  const { data: activeConfig } = useActiveConfiguration()
  // Only fetch chat history after hydration and when we have a sessionId
  const { data: chatHistory, refetch: refetchHistory, isLoading: isLoadingHistory } = useChatHistory(
    (isHydrated && sessionId) ? sessionId : ''
  );
  const { mutate: sendMessage, isPending: isTyping } = useSendMessage()

  // Enhanced session persistence - save to localStorage and update URL
  useEffect(() => {
    if (sessionId && isHydrated) {
      localStorage.setItem('chatSessionId', sessionId);
      
      // Update URL without causing page reload
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (sessionId) {
          url.searchParams.set('sessionId', sessionId);
        } else {
          url.searchParams.delete('sessionId');
        }
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [sessionId, isHydrated]);

  // Save RAG mode preference
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('chatRagMode', ragMode.toString());
    }
  }, [ragMode, isHydrated]);

  // Improved message handling - prevent duplicates and ensure consistency
  useEffect(() => {
    if (chatHistory?.messages?.length && localMessages.length && isInitialized) {
      // Check if server messages are newer than local messages
      const serverMessageIds = new Set(chatHistory.messages.map(m => m.content + m.timestamp));
      const hasNewServerMessages = localMessages.some(localMsg => 
        !serverMessageIds.has(localMsg.content + localMsg.timestamp)
      );
      
      if (!hasNewServerMessages) {
        console.log('Server messages are up to date, clearing local messages');
        setLocalMessages([]);
      }
    }
  }, [chatHistory?.messages, localMessages, isInitialized]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isTyping) return

    const message = newMessage
    const timestamp = new Date().toISOString()
    const tempUserId = `user-${Date.now()}`
    
    // Add user message immediately for better UX
    const userMessage: Message = {
      id: tempUserId,
      role: 'user',
      content: message,
      timestamp,
      sessionId: sessionId || 'temp'
    }
    
    setLocalMessages(prev => [...prev, userMessage])
    setNewMessage('')

    console.log('Frontend: Sending message with ragMode:', ragMode, 'sessionId:', sessionId);
    
    sendMessage({ message, sessionId, ragMode }, {
      onSuccess: (response) => {
        console.log('Message sent successfully:', response)
        
        // Add assistant message immediately
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant', 
          content: response.message.content,
          timestamp: new Date().toISOString(),
          sessionId: response.sessionId || sessionId
        }
        
        setLocalMessages(prev => [...prev, assistantMessage])
        
        // Update session ID if we got a new one
        if (!sessionId && response.sessionId) {
          console.log('New session created:', response.sessionId);
          setSessionId(response.sessionId);
        } else if (response.sessionId && response.sessionId !== sessionId) {
          console.log('Session ID updated:', response.sessionId);
          setSessionId(response.sessionId);
        }
        
        // Refresh history after a short delay to get server-side messages
        setTimeout(() => {
          refetchHistory();
        }, 1000);
      },
      onError: (error) => {
        console.error('Failed to send message:', error)
        // Remove the failed user message and restore the input
        setLocalMessages(prev => prev.filter(msg => msg.id !== tempUserId))
        setNewMessage(message)
      }
    })
  }

  const clearChat = () => {
    console.log('Clearing chat - current sessionId:', sessionId)
    setLocalMessages([])
    setSessionId('')
    if (isHydrated) {
      localStorage.removeItem('chatSessionId')
      // Clear URL parameter
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('sessionId');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Enhanced message combination with deduplication
  const serverMessages = chatHistory?.messages || []
  
  // If we're loading or have recent local messages, show local messages alongside server messages
  const allMessages = React.useMemo(() => {
    if (!isInitialized) return [];
    
    // If no server messages but we have local messages, show local only
    if (serverMessages.length === 0) {
      return localMessages;
    }
    
    // If we have server messages, show them with any new local messages
    const serverMessageSet = new Set(serverMessages.map(m => `${m.content}-${m.role}`));
    const newLocalMessages = localMessages.filter(localMsg => 
      !serverMessageSet.has(`${localMsg.content}-${localMsg.role}`)
    );
    
    return [...serverMessages, ...newLocalMessages];
  }, [serverMessages, localMessages, isInitialized]);

    // Enhanced logging for debugging
  useEffect(() => {
    if (sessionId && isInitialized) {
      console.log(`[Chat Session] ID: ${sessionId}, Server messages: ${serverMessages.length}, Local messages: ${localMessages.length}, Total: ${allMessages.length}`);
    }
  }, [sessionId, serverMessages.length, localMessages.length, allMessages.length, isInitialized]);

  return {
    // State
    messages: allMessages,
    newMessage,
    isTyping,
    activeConfig,
    ragMode,
    sessionId, // Expose sessionId for external use
    isInitialized,
    isLoadingHistory,

    // Actions
    setNewMessage,
    handleSendMessage,
    handleKeyPress,
    clearChat,
    setRagMode,
    refetchHistory, // Expose refetch for manual refresh
  }
} 