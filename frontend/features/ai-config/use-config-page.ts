import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  useAIConfigurations,
  useCreateConfiguration,
  useUpdateConfiguration,
  useDeleteConfiguration,
  useActivateConfiguration,
  useTestConfiguration
} from './hooks'
import { AIConfiguration } from './types'
import ConfigService from '@/lib/services/config.service'

const ProvidersEnum = z.enum(['openai', 'anthropic', 'ollama', 'huggingface'])

const configFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  modelProvider: ProvidersEnum,
  modelName: z.string().min(1, 'Model name is required'),
  systemPrompt: z.string(),
  temperature: z.coerce.number().min(0).max(1),
  maxTokens: z.coerce.number().min(1),
  topP: z.coerce.number().min(0).max(1),
  frequencyPenalty: z.coerce.number().min(-2).max(2),
  presencePenalty: z.coerce.number().min(-2).max(2),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  isActive: z.coerce.boolean(),
  // Accept any JSON object or null to avoid blocking submission when text is being edited
  additionalSettings: z.any().nullable(),
}).superRefine((data, ctx) => {
  const provider = data.modelProvider
  if (["openai", "anthropic", "huggingface"].includes(provider)) {
    if (!data.apiKey || data.apiKey.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'API key is required for the selected provider',
        path: ['apiKey'],
      })
    }
  }
  if (provider === 'ollama' && data.baseUrl && !/^https?:\/\//i.test(data.baseUrl)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Base URL must start with http:// or https://',
      path: ['baseUrl'],
    })
  }
})

type ConfigFormValues = z.infer<typeof configFormSchema>

export function useConfigPage() {
  const [showDialog, setShowDialog] = useState(false)
  const [selectedConfig, setSelectedConfig] = useState<AIConfiguration | null>(null)
  const [configService] = useState(() => ConfigService.getInstance())
  const [appConfig, setAppConfig] = useState<any>(null)

  // Load app configuration
  useEffect(() => {
    const loadAppConfig = async () => {
      try {
        const config = await configService.loadConfig()
        setAppConfig(config)
      } catch (error) {
        console.error('Failed to load app config:', error)
      }
    }
    loadAppConfig()
  }, [configService])

  const { data: configsResponse } = useAIConfigurations()
  const configs = configsResponse?.data || []
  
  const createMutation = useCreateConfiguration()
  const updateMutation = useUpdateConfiguration()
  const deleteMutation = useDeleteConfiguration()
  const activateMutation = useActivateConfiguration()
  const testMutation = useTestConfiguration()

  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configFormSchema) as any,
    defaultValues: {
      name: '',
      modelProvider: 'openai',
      modelName: '',
      systemPrompt: '',
      temperature: 0.7,
      maxTokens: 2000,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      apiKey: '',
      baseUrl: '',
      isActive: true,
      additionalSettings: null,
    },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  })

  // Watch for modelProvider changes to set default baseUrl
  const watchedProvider = form.watch('modelProvider')
  useEffect(() => {
    const isLocal = typeof window !== 'undefined' && /(localhost|127\.0\.0\.1)/i.test(window.location.hostname)
    if (watchedProvider === 'ollama' && !selectedConfig) {
      // In local dev prefer no baseUrl (backend defaults to 127.0.0.1)
      if (isLocal) {
        form.setValue('baseUrl', '')
      } else {
        // In hosted env suggest configured tunnel if present, else empty
        const suggested = appConfig?.tunneling?.pagekite_url || ''
        form.setValue('baseUrl', suggested)
      }
    } else if (watchedProvider !== 'ollama' && !selectedConfig) {
      form.setValue('baseUrl', '')
    }
  }, [watchedProvider, selectedConfig, form, appConfig])

  const handleSubmit = async (data: ConfigFormValues) => {
    try {
      // Prepare payload to satisfy backend validators
      const provider = data.modelProvider
      let additional: any = undefined
      if (data.additionalSettings && typeof data.additionalSettings === 'object') {
        additional = data.additionalSettings
      } else if (typeof data.additionalSettings === 'string') {
        try {
          additional = JSON.parse(data.additionalSettings)
        } catch {
          additional = undefined // avoid sending invalid JSON string
        }
      }

      const payload: ConfigFormValues = {
        ...data,
        baseUrl: provider === 'ollama' ? (data.baseUrl?.trim() || '') : undefined as any,
        apiKey: data.apiKey?.trim() || (provider === 'ollama' ? undefined as any : ''),
        additionalSettings: additional as any,
      }

      if (selectedConfig) {
        await updateMutation.mutateAsync({
          id: selectedConfig.id!,
          config: payload as any,
        })
      } else {
        await createMutation.mutateAsync(payload as any)
      }
      setShowDialog(false)
      form.reset()
    } catch (error) {
      console.error('Failed to save configuration:', error)
    }
  }

  const handleEdit = (config: AIConfiguration) => {
    setSelectedConfig(config)
    // Normalize missing numeric fields to defaults so validation passes
    const configToEdit: ConfigFormValues = {
      name: config.name ?? '',
      modelProvider: (config.modelProvider as any) ?? 'openai',
      modelName: config.modelName ?? '',
      systemPrompt: config.systemPrompt ?? '',
      temperature: (config as any).temperature ?? 0.7,
      maxTokens: (config as any).maxTokens ?? 2000,
      topP: (config as any).topP ?? 1,
      frequencyPenalty: (config as any).frequencyPenalty ?? 0,
      presencePenalty: (config as any).presencePenalty ?? 0,
      apiKey: config.apiKey ?? '',
      baseUrl: config.baseUrl ?? '',
      isActive: (config as any).isActive ?? true,
      additionalSettings: config.additionalSettings ?? null,
    }
    form.reset(configToEdit)
    setShowDialog(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
    } catch (error) {
      console.error('Failed to delete configuration:', error)
    }
  }

  const handleActivate = async (id: string) => {
    try {
      await activateMutation.mutateAsync(id)
    } catch (error) {
      console.error('Failed to activate configuration:', error)
    }
  }

  const handleTest = async (id: string) => {
    try {
      const result = await testMutation.mutateAsync(id)
      // You could add toast notifications here
      console.log('Test result:', result)
    } catch (error) {
      console.error('Failed to test configuration:', error)
    }
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    setSelectedConfig(null)
    form.reset()
  }

  const handleOpenNew = () => {
    setSelectedConfig(null)
    form.reset()
    setShowDialog(true)
  }

  return {
    // State
    configs,
    showDialog,
    selectedConfig,
    form,
    isLoading: createMutation.isPending || updateMutation.isPending,
    isError: createMutation.isError || updateMutation.isError,

    // Actions
    setShowDialog,
    handleSubmit: form.handleSubmit((d) => handleSubmit(d as ConfigFormValues)) as any,
    handleEdit,
    handleDelete,
    handleActivate,
    handleTest,
    handleCloseDialog,
    handleOpenNew,
  }
}