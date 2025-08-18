import axiosInstance from '@/lib/api/axios'
import { API_ENDPOINTS } from '@/lib/constants/endpoints'
import { PerformanceMetrics, PerformanceMetricsResponse, PerformanceReport, PerformanceReportResponse, SystemHealth, TimeFrame, PerformanceSummary } from './types'

const rangeFromTimeframe = (timeframe: TimeFrame) => {
  const end = new Date()
  const start = new Date(end)
  if (timeframe === '24h') start.setHours(end.getHours() - 24)
  else if (timeframe === '7d') start.setDate(end.getDate() - 7)
  else if (timeframe === '30d') start.setDate(end.getDate() - 30)
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  }
}

export const analyticsService = {
  getAnalytics: async (timeframe: TimeFrame): Promise<PerformanceMetrics> => {
    const response = await axiosInstance.get(API_ENDPOINTS.REPORTS.HEALTH)
    const data = response.data?.success ? response.data.data : response.data
    const mapStatus = (s: string): PerformanceMetrics['status'] => {
      if (s === 'healthy') return 'success'
      if (s === 'warning') return 'warning'
      return 'error'
    }
    const metrics: PerformanceMetrics = {
      totalRequests: data?.totalRequests ?? 0,
      averageResponseTime: data?.averageResponseTime ?? 0,
      errorRate: data?.errorRate ?? 0,
      status: mapStatus(data?.status || 'warning'),
      timestamp: new Date().toISOString(),
      successRate: data?.totalRequests ? 100 - (data?.errorRate ?? 0) : 100,
    }
    return metrics
  },

  getPerformanceReport: async (timeframe?: TimeFrame): Promise<PerformanceReport> => {
    const params = timeframe ? rangeFromTimeframe(timeframe) : undefined
    const response = await axiosInstance.get(API_ENDPOINTS.REPORTS.PERFORMANCE, { params })
    return response.data
  },

  getPerformanceSummary: async (timeframe?: TimeFrame): Promise<PerformanceSummary> => {
    const params = timeframe ? rangeFromTimeframe(timeframe) : undefined
    const response = await axiosInstance.get(API_ENDPOINTS.REPORTS.PERFORMANCE, { params })
    return response.data?.success ? response.data.data : response.data
  },

  getPerformanceMetrics: async (timeframe?: TimeFrame): Promise<PerformanceMetrics> => {
    const params = timeframe ? rangeFromTimeframe(timeframe) : undefined
    const response = await axiosInstance.get(API_ENDPOINTS.REPORTS.METRICS, { params })
    return response.data?.success ? response.data.data : response.data
  },

  getHealth: async (): Promise<SystemHealth> => {
    const response = await axiosInstance.get(API_ENDPOINTS.REPORTS.HEALTH)
    return response.data?.success ? response.data.data : response.data
  },

  getAllReports: async (): Promise<PerformanceReportResponse> => {
    const response = await axiosInstance.get(API_ENDPOINTS.REPORTS.BASE)
    return response.data
  },

  generateReport: async (): Promise<PerformanceReport> => {
    const response = await axiosInstance.post(API_ENDPOINTS.REPORTS.GENERATE)
    return response.data
  },

  getReportById: async (id: string): Promise<PerformanceReport> => {
    const response = await axiosInstance.get(API_ENDPOINTS.REPORTS.BY_ID(id))
    return response.data
  },

  downloadReport: async (id: string): Promise<Blob> => {
    const response = await axiosInstance.get(API_ENDPOINTS.REPORTS.DOWNLOAD(id))
    const payload = response.data?.success ? response.data.data : response.data
    const blob = new Blob([payload.content || ''], { type: 'text/plain;charset=utf-8' })
    if (typeof window !== 'undefined') {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = payload.filename || `${id}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
    return blob
  }
}