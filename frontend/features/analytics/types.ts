export interface PerformanceTimeSeriesPoint {
  time: string
  requests: number
  avgResponseTime: number
  errorRate: number
  successRate: number
}

export interface EndpointStat {
  key: string
  count: number
  averageResponseTime: number
  successRate: number
  errors: number
}

export interface PerformanceSummary {
  totalRequests: number
  averageResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  p50: number
  p90: number
  p99: number
  successRate: number
  errorRate: number
  uptime: number
  endpointStats: Record<string, EndpointStat>
  topSlowEndpoints: EndpointStat[]
  topErrorEndpoints: EndpointStat[]
  responseTimeDistribution: Record<string, number>
  statusCodeDistribution: Record<string, number>
  methodDistribution: Record<string, number>
  timeSeries: PerformanceTimeSeriesPoint[]
  anomalies?: string[]
}

// Existing lightweight metrics shape (kept for compatibility in other parts of UI)
export interface PerformanceMetrics {
  totalRequests: number
  averageResponseTime: number
  errorRate: number
  status: 'success' | 'warning' | 'error'
  timestamp: string
  successRate?: number
  requestsPerMinute?: number
  modelUsage?: {
    model: string
    count: number
  }[]
  timeDistribution?: {
    hour: number
    count: number
  }[]
}

export interface PerformanceMetricsResponse {
  success: boolean
  data: PerformanceMetrics
}

export interface PerformanceReport {
  id: string
  createdAt: string
  metrics: PerformanceMetrics
  summary: string
  status: 'completed' | 'pending' | 'failed'
}

export interface PerformanceReportResponse {
  data: PerformanceReport[]
  total: number
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  components: {
    name: string
    status: 'healthy' | 'degraded' | 'unhealthy'
    message?: string
  }[]
  timestamp: string
}

export type TimeFrame = '24h' | '7d' | '30d'