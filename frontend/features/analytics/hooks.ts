import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { analyticsService } from './service'
import { TimeFrame, PerformanceSummary } from './types'
import { toast } from 'sonner'
import { MESSAGES } from '@/lib/constants/messages'

export const useAnalytics = (timeframe: TimeFrame) => {
  return useQuery({
    queryKey: ['analytics', timeframe],
    queryFn: () => analyticsService.getAnalytics(timeframe),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Auto-refresh periodically so charts keep updating
    refetchInterval: 30 * 1000,
  })
}

export const usePerformanceSummary = (timeframe: TimeFrame) => {
  return useQuery<PerformanceSummary>({
    queryKey: ['performanceSummary', timeframe],
    queryFn: () => analyticsService.getPerformanceSummary(timeframe),
    staleTime: 60 * 1000,
    retry: 2,
    // Keep dashboard fresh
    refetchInterval: 30 * 1000,
  })
}

export const usePerformanceReport = () => {
  return useQuery({
    queryKey: ['performanceReport'],
    queryFn: () => analyticsService.getPerformanceReport(),
  })
}

export const usePerformanceMetrics = () => {
  return useQuery({
    queryKey: ['performanceMetrics'],
    queryFn: () => analyticsService.getPerformanceMetrics(),
  })
}

export const useAllReports = () => {
  return useQuery({
    queryKey: ['reports'],
    queryFn: analyticsService.getAllReports
  })
}

export const useGenerateReport = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: analyticsService.generateReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      toast.success(MESSAGES.SUCCESS.REPORTS.GENERATE)
    },
    onError: () => {
      toast.error(MESSAGES.ERROR.REPORTS.GENERATE)
    }
  })
}

export const useReportById = (id: string) => {
  return useQuery({
    queryKey: ['report', id],
    queryFn: () => analyticsService.getReportById(id),
    enabled: !!id
  })
}

export const useDownloadReport = () => {
  return useMutation({
    mutationFn: analyticsService.downloadReport,
    onSuccess: () => {
      toast.success(MESSAGES.SUCCESS.REPORTS.DOWNLOAD)
    },
    onError: () => {
      toast.error(MESSAGES.ERROR.REPORTS.DOWNLOAD)
    }
  })
}