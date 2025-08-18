import { useEffect, useState } from 'react'
import { useAnalytics } from './hooks'
import { TimeFrame } from './types'
import { toast } from 'sonner'
import { MESSAGES } from '@/lib/constants/messages'

export function useAnalyticsPage() {
  const [timeframe, setTimeframe] = useState<TimeFrame>('24h')
  
  const { 
    data: metrics,
    isLoading,
    error
  } = useAnalytics(timeframe)

  useEffect(() => {
    if (error) {
      toast.error(MESSAGES.ERROR.ANALYTICS.FETCH)
    }
  }, [error])

  return {
    // State
    timeframe,
    metrics,
    isLoading,
    error,

    // Actions
    setTimeframe,
  }
}