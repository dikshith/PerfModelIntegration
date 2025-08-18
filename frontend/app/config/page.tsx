"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useConfigPage } from "@/features/ai-config/use-config-page"
import { ChevronDown, ChevronUp, Info, RefreshCw, CheckCircle, XCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { ollamaService, type OllamaModel } from "@/lib/services/ollama.service"
import ConfigService from "@/lib/services/config.service"
import axiosInstance from "@/lib/api/axios"
import { API_ENDPOINTS } from "@/lib/constants/endpoints"

export default function ConfigPage() {
  const {
    configs,
    showDialog,
    selectedConfig,
    form,
    isLoading,
    isError,
    setShowDialog,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleActivate,
    handleTest,
    handleCloseDialog,
    handleOpenNew,
  } = useConfigPage()

  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [ollamaStatus, setOllamaStatus] = useState<{ isRunning: boolean; version?: string; error?: string }>({ isRunning: false })
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [showOllamaSetup, setShowOllamaSetup] = useState(false)
  const [configService] = useState(() => ConfigService.getInstance())
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null)

  interface AppConfig {
    tunneling: {
      pagekite_url: string;
      enabled: boolean;
      description: string;
    };
    ollama: {
      default_model: string;
      temperature: number;
      max_tokens: number;
    };
    backend: {
      url: string;
    };
  }

  // Load app configuration
  const loadAppConfig = async () => {
    try {
      const config = await configService.loadConfig()
      setAppConfig(config)
    } catch (error) {
      console.error('Failed to load app config:', error)
    }
  }

  useEffect(() => {
    loadAppConfig()
  }, [])  // loadAppConfig is stable

  // Check Ollama status on component mount
  const checkOllamaStatus = async () => {
    try {
      // Set the Ollama service to use PageKite URL from app config
      if (appConfig?.tunneling?.pagekite_url) {
        ollamaService.setBaseUrl(appConfig.tunneling.pagekite_url)
      }

      // Try to get active configuration to set the correct base URL
      try {
        const response = await axiosInstance.get(API_ENDPOINTS.CONFIG.ACTIVE)
        if (response.status === 200) {
          const data = response.data
          const active = data?.data ?? data
          if (active?.modelProvider === 'ollama' && active?.baseUrl) {
            ollamaService.setBaseUrl(active.baseUrl)
          }
        }
      } catch (error) {
        // If we can't get active config, use PageKite URL from app config or localhost
        console.log('Could not get active config, using app config or localhost')
      }

      // First try client-side direct check (may fail due to CORS)
      let status = await ollamaService.checkStatus()

      // If client-side says not running due to CORS, ask backend to check
      if (!status.isRunning && status.error && status.error.toLowerCase().includes('cors')) {
        try {
          const serverResp = await axiosInstance.get(API_ENDPOINTS.CONFIG.OLLAMA_STATUS)
          if (serverResp.status === 200) {
            const srv = serverResp.data
            const data = srv?.data ?? srv
            if (data?.isRunning) {
              status = { isRunning: true, version: data.version }
            }
          }
        } catch (e) {
          // ignore
        }
      }

      setOllamaStatus(status)
      if (status.isRunning) {
        try { await loadAvailableModels() } catch { /* ignore model load errors */ }
      }
    } catch (error) {
      console.error('Error checking Ollama status:', error)
      setOllamaStatus({ isRunning: false, error: 'Failed to check Ollama status' })
    }
  }

  useEffect(() => {
    if (appConfig) {  // Only check Ollama status after config is loaded
      checkOllamaStatus()
    }
  }, [appConfig])  // Re-check when appConfig changes

  const loadAvailableModels = async () => {
    setIsLoadingModels(true)
    try {
      const models = await ollamaService.getAvailableModels()
      setAvailableModels(models)
    } catch (error) {
      console.error('Error loading models:', error)
      setAvailableModels([])
    } finally {
      setIsLoadingModels(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Ollama Setup Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Local Ollama Connection</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {ollamaStatus.isRunning ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  <XCircle className="h-3 w-3 mr-1" />
                  Not Connected
                </Badge>
              )}
              <Button 
                size="sm" 
                variant="outline" 
                onClick={checkOllamaStatus}
                disabled={isLoadingModels}
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingModels ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <CardDescription>
            This app connects directly to your local Ollama installation running on your computer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ollamaStatus.isRunning ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">✓ Ollama is running locally</p>
                  {ollamaStatus.version && (
                    <p className="text-xs text-muted-foreground">Version: {ollamaStatus.version}</p>
                  )}
                </div>
              </div>
              
              {availableModels.length > 0 ? (
                <div>
                  <p className="text-sm font-medium mb-2">Available Models ({availableModels.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {availableModels.slice(0, 5).map((model) => (
                      <Badge key={model.name} variant="outline" className="text-xs">
                        {model.name}
                      </Badge>
                    ))}
                    {availableModels.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{availableModels.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-amber-700">No models found. Install a model first:</p>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 block">
                    ollama pull llama3.1
                  </code>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-800 mb-2">Ollama not detected</p>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowOllamaSetup(!showOllamaSetup)}
                >
                  Show Setup Instructions
                </Button>
              </div>
              
              {showOllamaSetup && (
                <div className="space-y-3">
                  <h4 className="font-medium">Setup Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    {ollamaService.getSetupInstructions().map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ol>
                  
                  <div className="mt-4">
                    <h5 className="font-medium text-sm mb-2">Recommended Models:</h5>
                    <div className="space-y-2">
                      {ollamaService.getRecommendedModels().slice(0, 3).map((model) => (
                        <div key={model.name} className="flex justify-between items-center text-xs">
                          <div>
                            <span className="font-mono">{model.name}</span>
                            <span className="text-muted-foreground ml-2">({model.size})</span>
                          </div>
                          <span className="text-muted-foreground">{model.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">AI Configurations</h1>
          <p className="text-muted-foreground">Manage your AI model configurations and settings</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew}>
              Add Configuration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedConfig ? 'Edit Configuration' : 'New Configuration'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter configuration name" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="modelProvider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Provider</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a provider" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="openai">OpenAI</SelectItem>
                              <SelectItem value="anthropic">Anthropic</SelectItem>
                              <SelectItem value="ollama">Ollama</SelectItem>
                              <SelectItem value="huggingface">Hugging Face</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="modelName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model Name</FormLabel>
                          <FormControl>
                            {form.watch('modelProvider') === 'ollama' && ollamaStatus.isRunning && availableModels.length > 0 ? (
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an available model" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableModels.map((model) => (
                                    <SelectItem key={model.name} value={model.name}>
                                      <div className="flex items-center justify-between w-full">
                                        <span>{model.name}</span>
                                        <span className="text-xs text-muted-foreground ml-2">
                                          {(model.size / 1024 / 1024 / 1024).toFixed(1)}GB
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input 
                                placeholder={
                                  form.watch('modelProvider') === 'ollama' 
                                    ? "e.g., llama3.1:8b (install models first)"
                                    : "Enter model name"
                                } 
                                {...field}
                                value={field.value ?? ''}
                              />
                            )}
                          </FormControl>
                          {form.watch('modelProvider') === 'ollama' && !ollamaStatus.isRunning && (
                            <p className="text-xs text-amber-600 mt-1">
                              Start Ollama to see available models
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* PageKite Tunnel URL field - Only shown for Ollama */}
                    {form.watch('modelProvider') === 'ollama' && (
                      <FormField
                        control={form.control}
                        name="baseUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              <div className="flex items-center gap-1">
                                <span>Ollama URL</span>
                                <Badge variant="outline" className="font-normal">For Remote Access</Badge>
                              </div>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={appConfig?.tunneling?.pagekite_url || "e.g., https://your-tunnel.pagekite.me"}
                                {...field}
                                value={field.value ?? ''}
                              />
                            </FormControl>
                            <div className="text-xs text-muted-foreground mt-1">
                              <p className="mb-1">• Leave empty to use localhost (default for local use)</p>
                              <p className="mb-1">• For remote access, enter your PageKite URL</p>
                              <p className="mb-1">• Current config: <code className="bg-gray-100 px-1 rounded">{appConfig?.tunneling?.pagekite_url || 'Not configured'}</code></p>
                              <p>
                                <Button variant="link" className="h-auto p-0 text-xs" onClick={() => window.open('/TUNNELING_GUIDE.md')}>                                  
                                  View PageKite Setup Guide
                                </Button>
                              </p>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={form.control}
                      name="systemPrompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>System Prompt</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter system prompt"
                              className="min-h-[100px]"
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="temperature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Temperature ({typeof field.value === 'number' ? field.value : 0.7})</FormLabel>
                          <FormControl>
                            <Slider
                              min={0}
                              max={1}
                              step={0.1}
                              value={[typeof field.value === 'number' ? field.value : 0.7]}
                              onValueChange={([value]) => field.onChange(value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="maxTokens"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Tokens</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              placeholder="Enter max tokens"
                              {...field}
                              value={typeof field.value === 'number' ? field.value : (field.value ? Number(field.value) : 0)}
                              onChange={e => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>Active</FormLabel>
                          <FormControl>
                            <Switch
                              checked={!!field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Collapsible
                      open={showAdvancedSettings}
                      onOpenChange={setShowAdvancedSettings}
                      className="space-y-4"
                    >
                      <CollapsibleTrigger className="flex items-center justify-between w-full">
                        <h3 className="text-sm font-medium">Advanced Settings</h3>
                        {showAdvancedSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="apiKey"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>API Key</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Enter API key"
                                  {...field}
                                  value={field.value ?? ''}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        {/**
                         * Removed Base URL field for non-Ollama providers.
                         * Only Ollama requires/uses baseUrl. For OpenAI, leave baseUrl empty.
                         */}
                        {/* (no baseUrl input here) */}
                        <FormField
                          control={form.control}
                          name="additionalSettings"
                          render={({ field: { onChange, value, ...field } }) => (
                            <FormItem>
                              <FormLabel>Additional Settings (JSON)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter additional settings in JSON format"
                                  className="font-mono min-h-[100px]"
                                  value={value === null ? "" : typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                                  onChange={e => {
                                    const trimmedValue = e.target.value.trim()
                                    if (!trimmedValue) {
                                      onChange(null)
                                      return
                                    }
                                    try {
                                      const parsed = JSON.parse(trimmedValue)
                                      onChange(parsed)
                                    } catch {
                                      // Keep the invalid JSON as a string so the user can fix it
                                      onChange(trimmedValue)
                                    }
                                  }}
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {selectedConfig ? 'Update' : 'Create'} Configuration
                  </Button>
                </div>
                {isError && (
                  <p className="text-sm text-destructive mt-2">
                    Failed to {selectedConfig ? 'update' : 'create'} configuration
                  </p>
                )}
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {configs.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{config.name}</CardTitle>
                  <CardDescription>{config.modelProvider}</CardDescription>
                </div>
                {config.isActive && (
                  <Badge variant="default">Active</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Model:</span> {config.modelName}
                </div>
                <div>
                  <span className="font-medium">Temperature:</span> {config.temperature}
                </div>
                <div>
                  <span className="font-medium">Max Tokens:</span> {config.maxTokens}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => handleEdit(config)}>
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleTest(config.id!)}>
                Test
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDelete(config.id!)}>
                Delete
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleActivate(config.id!)}
                disabled={config.isActive}
              >
                Activate
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}