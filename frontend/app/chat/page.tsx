"use client"

import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { useChatPage } from "@/features/chat/use-chat-page"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useKnowledgeBase, useUploadKnowledge, useDeleteKnowledge, useClearKnowledge } from "@/features/chat/hooks"
import { FileText, Upload, X, Trash2 } from "lucide-react"
import { useRef } from "react"

export default function ChatPage() {
  const {
    messages,
    newMessage,
    isTyping,
    activeConfig,
    ragMode,
    setNewMessage,
    handleSendMessage,
    handleKeyPress,
    clearChat,
    setRagMode,
  } = useChatPage()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: knowledgeBase } = useKnowledgeBase()
  const { mutate: uploadKnowledge, isPending: isUploading } = useUploadKnowledge()
  const { mutate: deleteKnowledge, isPending: isDeleting } = useDeleteKnowledge()
  const { mutate: clearKnowledge, isPending: isClearing } = useClearKnowledge()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      uploadKnowledge(file)
    }
  }

  if (!activeConfig) {
    return (
      <Card className="p-6 text-center">
        <h2 className="text-lg font-semibold mb-2">No AI Configuration Selected</h2>
        <p className="text-muted-foreground">Please select or create an AI configuration to start chatting.</p>
      </Card>
    )
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold">Chat with AI</h2>
              <div className="flex items-center gap-2">
                <Switch
                  id="rag-mode"
                  checked={ragMode}
                  onCheckedChange={setRagMode}
                />
                <label htmlFor="rag-mode" className="text-sm font-medium">
                  RAG Mode {ragMode && <span className="text-primary">(Using Documents)</span>}
                </label>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
              disabled={messages.length === 0}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Chat
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <Avatar className="mt-1">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                      {message.role === 'user' ? 'U' : 'A'}
                    </div>
                  </Avatar>
                  <div
                    className={`rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3 flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-foreground/50 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-foreground/50 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-foreground/50 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="min-h-[44px] max-h-[120px]"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isTyping}
                className="shrink-0"
              >
                Send
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="shrink-0">
            <FileText className="h-4 w-4 mr-2" />
            Knowledge Base
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Knowledge Base</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept=".txt,.pdf,.doc,.docx"
              />
              <Button
                variant="outline"
                onClick={() => clearKnowledge()}
                disabled={isClearing || !knowledgeBase?.data?.length}
              >
                Clear All
              </Button>
            </div>

            <div className="space-y-2">
              {knowledgeBase?.data?.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 rounded-md border"
                >
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {file.type} • {(file.size / 1024).toFixed(1)}KB
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteKnowledge(file.id)}
                    disabled={isDeleting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {!knowledgeBase?.data?.length && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-2" />
                  <p>No files uploaded</p>
                  <p className="text-sm">Upload files to enhance AI responses</p>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
} 