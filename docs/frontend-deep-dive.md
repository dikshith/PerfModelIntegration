# Frontend Deep Dive: Next.js & React Architecture

## 🏗 Overview

The frontend is built using **Next.js 15** with the **App Router**, leveraging modern React patterns, TypeScript, and a comprehensive UI component system. This implementation provides a responsive, performant, and user-friendly interface for AI chat, RAG functionality, and performance analytics.

## Key updates in this codebase
- Chat always carries a sessionId and persists across navigation (URL param + localStorage).
- RAG mode requests are always routed to the backend; no direct client-to-Ollama calls in ragMode.
- Resilient UX: when send fails or times out, a polling fallback refetches saved answers from history.
- Configuration UI: provider=ollama doesn’t require an apiKey; validates baseUrl (prefer https tunnel URLs in production).

## 🎯 Core Architecture

### Framework Choice: Next.js 15 with App Router
**Why Next.js 15?**
- **App Router**: New routing system with layouts and nested routing
- **Server Components**: Automatic optimization between server and client rendering
- **Streaming**: Progressive page loading for better performance
- **Built-in Optimization**: Automatic image, font, and script optimization
- **TypeScript First**: Excellent TypeScript integration
- **Vercel Integration**: Seamless deployment and edge functions
- **React 18 Features**: Concurrent rendering and automatic batching

### Project Structure Deep Analysis

```
frontend/
├── app/                     # App Router directory structure
│   ├── layout.tsx          # Root layout component
│   ├── page.tsx            # Home page
│   ├── globals.css         # Global styles
│   ├── providers.tsx       # React Query and context providers
│   ├── chat/              # Chat feature pages
│   │   ├── page.tsx       # Chat interface
│   │   └── layout.tsx     # Chat-specific layout
│   ├── analytics/         # Performance analytics pages
│   │   └── page.tsx       # Analytics dashboard
│   ├── config/            # AI configuration pages
│   │   └── page.tsx       # Configuration interface
│   └── reports/           # Reporting pages
│       └── page.tsx       # Report generation interface
├── components/             # Reusable UI components
│   ├── ui/                # Base UI components (shadcn/ui)
│   └── root-layout-client.tsx # Client-side layout wrapper
├── features/              # Feature-specific components
│   ├── chat/              # Chat functionality
│   ├── ai-config/         # AI configuration
│   └── analytics/         # Analytics components
├── lib/                   # Utilities and configurations
│   ├── api/               # API client and hooks
│   ├── services/          # Business logic
│   ├── constants/         # Application constants
│   └── utils.ts           # Utility functions
└── public/                # Static assets
```

## 🔧 Technology Stack Deep Dive

### 1. Next.js 15 Configuration

**next.config.ts Analysis:**
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // React compiler for optimizations
  experimental: {
    reactCompiler: true,      // Enable React Compiler
    ppr: true,               // Partial Pre-rendering
  },
  
  // Image optimization
  images: {
    domains: ['localhost'],   // Add your image domains
    formats: ['image/webp', 'image/avif'],
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false, // Strict TypeScript checking
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### 2. TypeScript Configuration

**tsconfig.json Deep Analysis:**
```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],           // Browser APIs and modern JS
    "allowJs": true,                                 // Allow JS files
    "skipLibCheck": true,                           // Skip lib type checking
    "strict": true,                                 // Strict type checking
    "noEmit": true,                                // No compilation output
    "esModuleInterop": true,                       // CommonJS interop
    "module": "esnext",                            // Modern module system
    "moduleResolution": "bundler",                 // Bundler resolution
    "resolveJsonModule": true,                     // JSON imports
    "isolatedModules": true,                       // Isolated modules
    "jsx": "preserve",                             // Preserve JSX for Next.js
    "incremental": true,                           // Incremental compilation
    "plugins": [
      {
        "name": "next"                             // Next.js TypeScript plugin
      }
    ],
    "baseUrl": ".",                                // Base URL for imports
    "paths": {
      "@/*": ["./src/*"],                          // Path mapping
      "@/components/*": ["./components/*"],
      "@/features/*": ["./features/*"],
      "@/lib/*": ["./lib/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

### 3. Styling Architecture: Tailwind CSS + Shadcn/ui

**Tailwind Configuration:**
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ["class"],                             // Class-based dark mode
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
```

**Component Architecture with Shadcn/ui:**
```typescript
// components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

## 🔄 State Management: TanStack Query

### API Layer Architecture

**HTTP Client Configuration:**
```typescript
// lib/api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class APIClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        // Add auth headers, logging, etc.
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('Response Error:', error.response?.data || error.message);
        
        // Global error handling
        if (error.response?.status === 401) {
          // Handle unauthorized
          window.location.href = '/login';
        }
        
        return Promise.reject(error);
      }
    );
  }

  // HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete(url, config);
    return response.data;
  }
}

export const apiClient = new APIClient();
```

**TanStack Query Hooks:**
```typescript
// lib/api/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { toast } from 'sonner';

// Type definitions
interface AIConfiguration {
  id: string;
  provider: 'openai' | 'ollama';
  model: string;
  temperature: number;
  maxTokens: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sessionId: string;
}

interface SendMessageRequest {
  message: string;
  sessionId?: string;
  ragMode?: boolean;
}

// AI Configuration hooks
export const useActiveConfiguration = () => {
  return useQuery({
    queryKey: ['ai-configuration', 'active'],
    queryFn: () => apiClient.get<AIConfiguration>('/ai-configuration'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });
};

export const useCreateConfiguration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<AIConfiguration>) => 
      apiClient.post<AIConfiguration>('/ai-configuration', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-configuration'] });
      toast.success('Configuration saved successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save configuration');
    },
  });
};

// Chat hooks
export const useChatHistory = (sessionId: string) => {
  return useQuery({
    queryKey: ['chat', 'history', sessionId],
    queryFn: () => apiClient.get<{ messages: Message[] }>(`/chat/history/${sessionId}`),
    enabled: !!sessionId,
    staleTime: 30 * 1000,     // 30 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: SendMessageRequest) => 
      apiClient.post('/chat/message', data),
    onSuccess: (data, variables) => {
      // Invalidate chat history for the session
      queryClient.invalidateQueries({ 
        queryKey: ['chat', 'history', variables.sessionId] 
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send message');
    },
  });
};

// File upload hook
export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      return apiClient.post('/chat/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
      toast.success('Document uploaded successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload document');
    },
  });
};
```

### React Query Configuration

**Query Client Setup:**
```typescript
// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { Toaster } from 'sonner';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,     // Data is fresh for 1 minute
          gcTime: 5 * 60 * 1000,    // Cache for 5 minutes
          retry: 3,                 // Retry failed requests 3 times
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          refetchOnWindowFocus: false, // Don't refetch on window focus
        },
        mutations: {
          retry: 1,                 // Retry failed mutations once
          onError: (error: any) => {
            console.error('Mutation error:', error);
          },
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster 
        position="top-right"
        expand={false}
        richColors
        closeButton
      />
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

## 💬 Chat System Implementation

### Chat flow details
- Session persistence: sessionId is restored from URL and localStorage; URL is updated without reload.
- Message flow: optimistic user message, then mutation to POST /api/chat/message; on success, assistant message is appended and history refetched.
- ragMode: toggle stored in localStorage; when on, messages are posted with ragMode=true so RAG context is built on the server.
- Fallback handling: if the request errors or times out, the UI keeps the user message and refetches the conversation to surface any server-persisted fallback.

### File uploads for RAG
- Upload zone posts files to the backend; PDFs are parsed server-side; after success the knowledge base cache is invalidated.

**Chat Page Architecture**

**Main Chat Hook:**
```typescript
// features/chat/use-chat-page.ts
'use client';

import React, { useState, useEffect } from 'react';
import { 
  useActiveConfiguration, 
  useChatHistory, 
  useSendMessage,
} from '@/lib/api/hooks';
import type { Message } from '@/lib/api/types';

export function useChatPage() {
  // State management
  const [sessionId, setSessionId] = useState<string>('');
  const [isHydrated, setIsHydrated] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [ragMode, setRagMode] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Enhanced session persistence - load from localStorage and URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Try to get sessionId from URL params first
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
      
      // Restore RAG mode preference
      const savedRagMode = localStorage.getItem('chatRagMode') === 'true';
      setRagMode(savedRagMode);
      
      setIsHydrated(true);
      setIsInitialized(true);
    }
  }, []);
  
  // API hooks
  const { data: activeConfig } = useActiveConfiguration();
  const { data: chatHistory, refetch: refetchHistory, isLoading: isLoadingHistory } = 
    useChatHistory((isHydrated && sessionId) ? sessionId : '');
  const { mutate: sendMessage, isPending: isTyping } = useSendMessage();

  // Session persistence
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

  // RAG mode persistence
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('chatRagMode', ragMode.toString());
    }
  }, [ragMode, isHydrated]);

  // Message deduplication logic
  useEffect(() => {
    if (chatHistory?.messages?.length && localMessages.length && isInitialized) {
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
    if (!newMessage.trim() || isTyping) return;

    const message = newMessage;
    const timestamp = new Date().toISOString();
    const tempUserId = `user-${Date.now()}`;
    
    // Optimistic update - add user message immediately
    const userMessage: Message = {
      id: tempUserId,
      role: 'user',
      content: message,
      timestamp,
      sessionId: sessionId || 'temp'
    };
    
    setLocalMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    console.log('Frontend: Sending message with ragMode:', ragMode, 'sessionId:', sessionId);
    
    sendMessage({ message, sessionId, ragMode }, {
      onSuccess: (response) => {
        console.log('Message sent successfully:', response);
        
        // Add assistant message immediately
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant', 
          content: response.message.content,
          timestamp: new Date().toISOString(),
          sessionId: response.sessionId || sessionId
        };
        
        setLocalMessages(prev => [...prev, assistantMessage]);
        
        // Update session ID if we got a new one
        if (!sessionId && response.sessionId) {
          console.log('New session created:', response.sessionId);
          setSessionId(response.sessionId);
        } else if (response.sessionId && response.sessionId !== sessionId) {
          console.log('Session ID updated:', response.sessionId);
          setSessionId(response.sessionId);
        }
        
        // Refresh history after a delay
        setTimeout(() => {
          refetchHistory();
        }, 1000);
      },
      onError: (error) => {
        console.error('Failed to send message:', error);
        // Remove the failed user message and restore input
        setLocalMessages(prev => prev.filter(msg => msg.id !== tempUserId));
        setNewMessage(message);
      }
    });
  };

  // Clear chat functionality
  const clearChat = () => {
    console.log('Clearing chat - current sessionId:', sessionId);
    setLocalMessages([]);
    setSessionId('');
    if (isHydrated) {
      localStorage.removeItem('chatSessionId');
      // Clear URL parameter
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('sessionId');
        window.history.replaceState({}, '', url.toString());
      }
    }
  };

  // Keyboard handler
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Enhanced message combination with deduplication
  const serverMessages = chatHistory?.messages || [];
  
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

  // Debug logging
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
    sessionId,
    isInitialized,
    isLoadingHistory,

    // Actions
    setNewMessage,
    handleSendMessage,
    handleKeyPress,
    clearChat,
    setRagMode,
    refetchHistory,
  };
}
```

**Chat UI Component:**
```typescript
// features/chat/chat-interface.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Bot, User, FileText } from 'lucide-react';
import { useChatPage } from './use-chat-page';
import { MessageBubble } from './message-bubble';
import { FileUploadZone } from './file-upload-zone';

export function ChatInterface() {
  const {
    messages,
    newMessage,
    setNewMessage,
    handleSendMessage,
    handleKeyPress,
    clearChat,
    ragMode,
    setRagMode,
    isTyping,
    activeConfig,
    sessionId,
    isInitialized,
    isLoadingHistory,
  } = useChatPage();

  const [showFileUpload, setShowFileUpload] = useState(false);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Initializing chat...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Bot className="mr-2 h-5 w-5" />
              AI Chat Assistant
              {sessionId && (
                <Badge variant="outline" className="ml-2 text-xs">
                  Session: {sessionId.slice(0, 8)}...
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="rag-mode"
                  checked={ragMode}
                  onCheckedChange={setRagMode}
                />
                <label htmlFor="rag-mode" className="text-sm font-medium">
                  RAG Mode
                </label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFileUpload(!showFileUpload)}
              >
                <FileText className="h-4 w-4 mr-1" />
                Upload
              </Button>
              <Button variant="outline" size="sm" onClick={clearChat}>
                Clear Chat
              </Button>
            </div>
          </div>
          {activeConfig && (
            <div className="text-sm text-muted-foreground">
              Using {activeConfig.provider} - {activeConfig.model}
              {ragMode && (
                <Badge variant="secondary" className="ml-2">
                  Enhanced with documents
                </Badge>
              )}
            </div>
          )}
        </CardHeader>
        {showFileUpload && (
          <CardContent className="pt-0">
            <FileUploadZone onUploadSuccess={() => setShowFileUpload(false)} />
          </CardContent>
        )}
      </Card>

      {/* Messages */}
      <Card className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {isLoadingHistory && messages.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading conversation history...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation with your AI assistant</p>
                <p className="text-sm mt-2">
                  {ragMode ? 'RAG mode is enabled for enhanced responses' : 'Toggle RAG mode to use uploaded documents'}
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))
            )}
            {isTyping && (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Bot className="h-4 w-4" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span>AI is thinking...</span>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isTyping}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={isTyping || !newMessage.trim()}
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
```

## 📊 Analytics Dashboard Implementation

**Performance Analytics Component:**
```typescript
// features/analytics/performance-dashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Activity, Clock, AlertCircle, 
  CheckCircle2, Zap, Database, RefreshCw 
} from 'lucide-react';
import { usePerformanceMetrics, useGenerateReport } from '@/lib/api/hooks';

export function PerformanceDashboard() {
  const [timeRange, setTimeRange] = useState('24h');
  const { data: metrics, isLoading, refetch } = usePerformanceMetrics(timeRange);
  const { mutate: generateReport, isPending: isGenerating } = useGenerateReport();

  // Calculate key performance indicators
  const kpis = React.useMemo(() => {
    if (!metrics?.data) return null;

    return {
      totalRequests: metrics.data.length,
      avgResponseTime: metrics.data.reduce((acc, m) => acc + m.responseTime, 0) / metrics.data.length,
      errorRate: (metrics.data.filter(m => m.status >= 400).length / metrics.data.length) * 100,
      uptime: 99.8, // Calculate from actual data
    };
  }, [metrics]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Analytics</h1>
          <p className="text-muted-foreground">
            Monitor system performance and AI response metrics
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={() => generateReport({ timeRange })}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Generate AI Report
          </Button>
        </div>
      </div>

      {/* KPIs */}
      {kpis && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.totalRequests.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(kpis.avgResponseTime)}ms</div>
              <p className="text-xs text-muted-foreground">
                {kpis.avgResponseTime < 500 ? (
                  <span className="text-green-600">Excellent performance</span>
                ) : (
                  <span className="text-yellow-600">Could be improved</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.errorRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {kpis.errorRate < 1 ? (
                  <span className="text-green-600">Very stable</span>
                ) : (
                  <span className="text-red-600">Needs attention</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.uptime}%</div>
              <Badge variant={kpis.uptime > 99 ? 'default' : 'destructive'}>
                {kpis.uptime > 99 ? 'Healthy' : 'Issues detected'}
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Request Volume</CardTitle>
                <CardDescription>
                  API requests over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics?.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="requests" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
                <CardDescription>
                  Average response time trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics?.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="avgResponseTime" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Additional tab contents... */}
      </Tabs>
    </div>
  );
}
```

## 🔧 Performance Optimizations

### Code Splitting & Lazy Loading
```typescript
// Dynamic imports for heavy components
const PerformanceDashboard = dynamic(
  () => import('@/features/analytics/performance-dashboard'),
  { 
    loading: () => <div className="animate-pulse">Loading dashboard...</div>,
    ssr: false 
  }
);

const ChatInterface = dynamic(
  () => import('@/features/chat/chat-interface'),
  { 
    loading: () => <div className="animate-pulse">Loading chat...</div> 
  }
);
```

### Memoization Strategies
```typescript
// Expensive calculations with useMemo
const processedMessages = useMemo(() => {
  return messages.map(message => ({
    ...message,
    formattedTime: formatDistanceToNow(new Date(message.timestamp)),
    isRecent: Date.now() - new Date(message.timestamp).getTime() < 60000,
  }));
}, [messages]);

// Callback memoization
const handleMessageClick = useCallback((messageId: string) => {
  setSelectedMessage(prev => prev === messageId ? null : messageId);
}, []);
```

## ⚙️ Configuration UI specifics
- Provider=OpenAI: requires apiKey and model; optional baseUrl.
- Provider=Ollama: apiKey is optional; baseUrl required for production and should be a public HTTPS URL (e.g., PageKite). Local http://localhost:11434 is fine only in local dev.
- Validation and toasts guide users when models are missing/unavailable.

## 🚀 Deployment notes
- NEXT_PUBLIC_API_URL must point to the backend base URL. In production (Vercel), set it to your Heroku API URL.
- When using Ollama in production, ensure the backend is configured with OLLAMA_BASE_URL to a public tunnel; the frontend never connects to Ollama directly.

This comprehensive frontend architecture provides a robust, scalable, and highly performant user interface that leverages modern React patterns and Next.js optimization features.
