import axios from 'axios'
import { API_BASE_URL } from '@/lib/constants/endpoints'
import ConfigService from '@/lib/services/config.service'

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  // 0 disables timeout so long-running generations don't fail client-side
  timeout: 0,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Dynamically set baseURL for browser requests
axiosInstance.interceptors.request.use(async (config) => {
  try {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname || ''
      const port = window.location.port || ''

      // Detect local UI: localhost, loopback, private LAN IPs, or common dev ports
      const isLoopback = /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(hostname)
      const isPrivateLan = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(hostname)
      const isDevPort = ['3000', '5173', '5174'].includes(port)
      const isLocalUI = isLoopback || isPrivateLan || isDevPort

      if (isLocalUI) {
        const resolved = 'http://localhost:3001/api'
        axiosInstance.defaults.baseURL = resolved
        config.baseURL = resolved
        return config
      }

      // Hosted UI (e.g., Vercel): prefer public config.json backend.url if available
      const cfg = await ConfigService.getInstance().loadConfig()
      const backendBase = (cfg?.backend?.url || '').replace(/\/+$/, '')
      const resolved = backendBase ? `${backendBase}/api` : (API_BASE_URL || '')
      if (resolved) {
        axiosInstance.defaults.baseURL = resolved
        config.baseURL = resolved
      }
    }
  } catch (e) {
    // noop; fall back to existing baseURL
  }
  return config
})

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export default axiosInstance