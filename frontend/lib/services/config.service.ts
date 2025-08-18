interface TunnelingConfig {
  pagekite_url: string;
  enabled: boolean;
  description: string;
}

interface OllamaConfig {
  default_model: string;
  temperature: number;
  max_tokens: number;
}

interface BackendConfig {
  url: string;
}

interface AppConfig {
  tunneling: TunnelingConfig;
  ollama: OllamaConfig;
  backend: BackendConfig;
}

class ConfigService {
  private static instance: ConfigService;
  private config: AppConfig | null = null;

  private constructor() {}

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  async loadConfig(): Promise<AppConfig> {
    if (this.config) {
      return this.config;
    }

    try {
      // Try to load from local config file first
      const response = await fetch('/config.json');
      if (response.ok) {
        this.config = await response.json();
        return this.config!;
      }
    } catch (error) {
      console.warn('Could not load config.json, using defaults')
    }

    // Fallback to defaults
    this.config = {
      tunneling: {
        pagekite_url: 'https://your-tunnel.pagekite.me',
        enabled: true,
        description: 'Configure your PageKite tunnel URL here'
      },
      ollama: {
        default_model: 'llama3.1:8b',
        temperature: 0.7,
        max_tokens: 2048
      },
      backend: {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://backend-llmupwork-9cb4e17b5107.herokuapp.com'
          : 'http://localhost:3001'
      }
    };

    return this.config;
  }

  getConfig(): AppConfig | null {
    return this.config;
  }

  getPageKiteUrl(): string {
    return this.config?.tunneling.pagekite_url || 'https://your-tunnel.pagekite.me';
  }

  updatePageKiteUrl(url: string): void {
    if (this.config) {
      this.config.tunneling.pagekite_url = url;
    }
  }

  getDefaultOllamaModel(): string {
    return this.config?.ollama.default_model || 'llama3.1:8b';
  }

  getBackendUrl(): string {
    return this.config?.backend.url || 'https://backend-llmupwork-9cb4e17b5107.herokuapp.com';
  }
}

export default ConfigService;
