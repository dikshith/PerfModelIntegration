export interface AIConfiguration {
  id?: string
  name: string
  modelProvider: string
  modelName: string
  systemPrompt?: string
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  apiKey?: string
  baseUrl?: string
  isActive: boolean
  additionalSettings?: Record<string, unknown> | null
  createdAt?: string
  updatedAt?: string
}

export interface AIConfigurationResponse {
  data: AIConfiguration[]
  total: number
}

export interface AIConfigurationTestResponse {
  success: boolean
  message: string
  response?: string
  error?: string
} 