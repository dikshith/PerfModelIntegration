"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { Save, RefreshCw, ExternalLink } from "lucide-react"
import ConfigService from "@/lib/services/config.service"

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

export default function AppConfigPage() {
  const [configService] = useState(() => ConfigService.getInstance())
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const loadConfig = async () => {
    setIsLoading(true)
    try {
      const loadedConfig = await configService.loadConfig()
      setConfig(loadedConfig)
    } catch (error) {
      console.error('Failed to load config:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])  // loadConfig is stable since configService is in state

  const handleSave = () => {
    // In a real implementation, you would save this to a backend or local storage
    // For now, we'll just update the config service
    if (config) {
      configService.updatePageKiteUrl(config.tunneling.pagekite_url)
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2000)
    }
  }

  const handleInputChange = (section: keyof AppConfig, key: string, value: string | number | boolean) => {
    setConfig((prev: AppConfig | null) => {
      if (!prev) return null;
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value
        }
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">App Configuration</h1>
          <p className="text-muted-foreground">Manage your application settings and PageKite tunnel configuration</p>
        </div>
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {isSaved ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>

      {/* PageKite Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>PageKite Tunnel Configuration</span>
            <Badge variant="outline">Critical for Remote Access</Badge>
          </CardTitle>
          <CardDescription>
            Configure your PageKite tunnel URL to allow the deployed backend to connect to your local Ollama instance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pagekite-url">PageKite URL</Label>
            <Input
              id="pagekite-url"
              value={config?.tunneling?.pagekite_url || ''}
              onChange={(e) => handleInputChange('tunneling', 'pagekite_url', e.target.value)}
              placeholder="https://your-tunnel.pagekite.me"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Enter the full PageKite URL including https://. This URL will be used by the backend to connect to your local Ollama.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pagekite-description">Description</Label>
            <Input
              id="pagekite-description"
              value={config?.tunneling?.description || ''}
              onChange={(e) => handleInputChange('tunneling', 'description', e.target.value)}
              placeholder="Configure your PageKite tunnel URL here"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="pagekite-enabled"
              checked={config?.tunneling?.enabled || false}
              onChange={(e) => handleInputChange('tunneling', 'enabled', e.target.checked)}
            />
            <Label htmlFor="pagekite-enabled">Enable PageKite tunneling</Label>
          </div>
        </CardContent>
      </Card>

      {/* Ollama Default Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Default Ollama Settings</CardTitle>
          <CardDescription>
            Set default values for new Ollama configurations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default-model">Default Model</Label>
            <Input
              id="default-model"
              value={config?.ollama?.default_model || ''}
              onChange={(e) => handleInputChange('ollama', 'default_model', e.target.value)}
              placeholder="llama3.1:8b"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="default-temperature">Default Temperature</Label>
            <Input
              id="default-temperature"
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={config?.ollama?.temperature || 0.7}
              onChange={(e) => handleInputChange('ollama', 'temperature', parseFloat(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="default-max-tokens">Default Max Tokens</Label>
            <Input
              id="default-max-tokens"
              type="number"
              min="1"
              value={config?.ollama?.max_tokens || 2048}
              onChange={(e) => handleInputChange('ollama', 'max_tokens', parseInt(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Backend Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Backend Configuration</CardTitle>
          <CardDescription>
            Configure the backend API endpoint
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backend-url">Backend URL</Label>
            <div className="flex gap-2">
              <Input
                id="backend-url"
                value={config?.backend?.url || ''}
                onChange={(e) => handleInputChange('backend', 'url', e.target.value)}
                placeholder="https://your-backend.example.com"
                className="font-mono"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => window.open(config?.backend?.url, '_blank')}
                disabled={!config?.backend?.url}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Setup Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-medium">1. Start PageKite Tunnel</h4>
            <p className="text-sm text-muted-foreground">
              Start your PageKite tunnel (via the menu or scripts in the repo) and note the URL it provides.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">2. Update Configuration</h4>
            <p className="text-sm text-muted-foreground">
              Enter your PageKite URL in the field above and click &quot;Save Changes&quot;.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">3. Create AI Configuration</h4>
            <p className="text-sm text-muted-foreground">
              Go to the <Button variant="link" className="h-auto p-0" onClick={() => window.location.href = '/config'}>AI Configuration page</Button> and create a new Ollama configuration.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
