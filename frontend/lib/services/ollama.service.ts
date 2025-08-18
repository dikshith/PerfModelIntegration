// Ollama service for direct communication with user's local Ollama instance
// This service can connect to localhost or PageKite tunnel

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    parent_model?: string;
    format?: string;
    family?: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
}

export interface OllamaModelsResponse {
  models: OllamaModel[];
}

export interface OllamaStatus {
  isRunning: boolean;
  version?: string;
  error?: string;
}

class OllamaService {
  private baseUrl = 'http://127.0.0.1:11434';

  /**
   * Set the base URL for Ollama (can be localhost or PageKite URL)
   */
  setBaseUrl(url: string) {
    this.baseUrl = url || 'http://127.0.0.1:11434';
  }

  /**
   * Get current base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Get the URL with HTTPS enforcement for PageKite
   */
  private getSecureUrl(): string {
    let url = this.baseUrl;
    // Ensure HTTPS for PageKite URLs to avoid mixed content issues
    if (url.includes('pagekite.me') && url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
    }
    return url;
  }

  /**
   * Check if Ollama is running locally or via tunnel
   */
  async checkStatus(): Promise<OllamaStatus> {
    const candidates: string[] = [];
    const primary = this.getSecureUrl();
    candidates.push(primary);
    // Add loopback alternates to improve resilience
    if (!primary.includes('127.0.0.1')) candidates.push('http://127.0.0.1:11434');
    if (!primary.includes('localhost')) candidates.push('http://localhost:11434');

    for (const base of candidates) {
      try {
        const resp = await fetch(`${base}/api/version`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'omit',
        });
        if (resp.ok) {
          const data = await resp.json();
          return { isRunning: true, version: data.version };
        }
      } catch (err: unknown) {
        // continue to next candidate; record last error
        const msg = err instanceof Error ? err.message : String(err ?? '');
        // If it looks like a CORS/network block, surface that specifically
        if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
          return { isRunning: false, error: 'CORS blocked - Ollama running but not accessible from browser. Using backend fallback.' };
        }
      }
    }

    return { isRunning: false, error: 'Unable to reach Ollama on localhost/127.0.0.1' };
  }

  /**
   * Get all available models from local Ollama installation
   */
  async getAvailableModels(): Promise<OllamaModel[]> {
    try {
      const candidates: string[] = [];
      const primary = this.getSecureUrl();
      // Prefer local first when running the frontend locally
      const isLocal = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname || '');
      if (isLocal) {
        candidates.push('http://127.0.0.1:11434', 'http://localhost:11434');
        if (!primary.includes('127.0.0.1') && !primary.includes('localhost')) candidates.push(primary);
      } else {
        candidates.push(primary, 'http://127.0.0.1:11434', 'http://localhost:11434');
      }

      let lastError: unknown = null;
      for (const base of candidates) {
        try {
          const response = await fetch(`${base}/api/tags`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'omit',
          });
          if (response.ok) {
            const data: OllamaModelsResponse = await response.json();
            return data.models || [];
          }
          lastError = new Error(`HTTP ${response.status}`);
        } catch (error: unknown) {
          lastError = error;
          // try next candidate
        }
      }

      if (lastError instanceof Error) {
        throw lastError;
      }
      throw new Error('Failed to fetch models');
    } catch (error: unknown) {
      console.error('Error fetching Ollama models:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to connect to local Ollama instance'
      );
    }
  }

  /**
   * Test if a specific model is available
   */
  async isModelAvailable(modelName: string): Promise<boolean> {
    try {
      const models = await this.getAvailableModels();
      return models.some(model => model.name === modelName);
    } catch {
      return false;
    }
  }

  /**
   * Get model information
   */
  async getModelInfo(modelName: string): Promise<OllamaModel | null> {
    try {
      const models = await this.getAvailableModels();
      return models.find(model => model.name === modelName) || null;
    } catch {
      return null;
    }
  }

  /**
   * Test connection to a model with a simple prompt
   */
  async testModel(modelName: string, prompt: string = 'Hello'): Promise<boolean> {
    try {
      const response = await fetch(`${this.getSecureUrl()}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
        body: JSON.stringify({
          model: modelName,
          prompt: prompt,
          stream: false,
          options: {
            num_predict: 10, // Limit tokens for quick test
          },
        }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get connection instructions for users
   */
  getSetupInstructions(): string[] {
    return [
      '1. Download and install Ollama from https://ollama.ai',
      '2. Open a terminal/command prompt',
      '3. Run "ollama serve" to start the Ollama service (default: localhost:11434)',
      '4. Download a model: "ollama pull llama3.1" (or any model you prefer)',
      '5. For remote access: Set up PageKite tunnel to expose localhost:11434',
      '6. Configure PageKite URL in the AI Configuration form below',
      '7. Refresh this page and test the connection'
    ];
  }

  /**
   * Get popular model recommendations
   */
  getRecommendedModels(): Array<{ name: string; description: string; size: string }> {
    return [
      {
        name: 'llama3.1:8b',
        description: 'Meta Llama 3.1 - Good balance of performance and speed',
        size: '~4.7GB'
      },
      {
        name: 'llama3.1:70b',
        description: 'Meta Llama 3.1 - High performance, requires more resources',
        size: '~40GB'
      },
      {
        name: 'mistral:7b',
        description: 'Mistral 7B - Fast and efficient',
        size: '~4.1GB'
      },
      {
        name: 'codellama:7b',
        description: 'Code Llama - Specialized for programming tasks',
        size: '~3.8GB'
      },
      {
        name: 'phi3:mini',
        description: 'Microsoft Phi-3 Mini - Lightweight and fast',
        size: '~2.3GB'
      }
    ];
  }
}

// Export singleton instance
export const ollamaService = new OllamaService();
export default ollamaService;
