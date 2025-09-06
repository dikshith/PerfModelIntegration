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
        const raw = (await response.json()) as Partial<AppConfig>;
        const envBase = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/, '');
        const defaults: AppConfig = {
          tunneling: {
            pagekite_url: 'https://your-tunnel.pagekite.me',
            enabled: true,
            description: 'Configure your PageKite tunnel URL here',
          },
          ollama: {
            default_model: 'llama3.1:8b',
            temperature: 0.7,
            max_tokens: 2048,
          },
          backend: {
            url: envBase || (process.env.NODE_ENV === 'production'
              ? 'https://your-backend.example.com'
              : 'http://localhost:3001'),
          },
        };
        this.config = {
          tunneling: {
            pagekite_url: raw.tunneling?.pagekite_url ?? defaults.tunneling.pagekite_url,
            enabled: raw.tunneling?.enabled ?? defaults.tunneling.enabled,
            description: raw.tunneling?.description ?? defaults.tunneling.description,
          },
          ollama: {
            default_model: raw.ollama?.default_model ?? defaults.ollama.default_model,
            temperature: raw.ollama?.temperature ?? defaults.ollama.temperature,
            max_tokens: raw.ollama?.max_tokens ?? defaults.ollama.max_tokens,
          },
          backend: {
            url: envBase || raw.backend?.url || defaults.backend.url,
          },
        };
        return this.config;
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
        url: (process.env.NEXT_PUBLIC_API_BASE || (process.env.NODE_ENV === 'production'
          ? 'https://your-backend.example.com'
          : 'http://localhost:3001')) as string
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
    const envUrl = process.env.NEXT_PUBLIC_API_BASE
    const cfgUrl = this.config?.backend.url
    const url = (envUrl || cfgUrl || 'http://localhost:3001')
    return (url as string).replace(/\/+$/, '')
  }
}

export default ConfigService;
