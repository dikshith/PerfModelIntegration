import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { aiConfigService } from './service'
import { toast } from 'sonner'
import { MESSAGES } from '@/lib/constants/messages'
import { AIConfiguration } from './types'

export const useAIConfigurations = () => {
  return useQuery({
    queryKey: ['configurations'],
    queryFn: aiConfigService.getConfigurations
  })
}

export const useAIConfiguration = (id: string) => {
  return useQuery({
    queryKey: ['configuration', id],
    queryFn: () => aiConfigService.getConfiguration(id),
    enabled: !!id
  })
}

export const useActiveConfiguration = () => {
  return useQuery({
    queryKey: ['activeConfiguration'],
    queryFn: aiConfigService.getActiveConfiguration
  })
}

export const useCreateConfiguration = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: aiConfigService.createConfiguration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configurations'] })
      toast.success(MESSAGES.SUCCESS.CONFIG.CREATE)
    },
    onError: () => {
      toast.error(MESSAGES.ERROR.CONFIG.CREATE)
    }
  })
}

interface UpdateConfigurationVariables {
  id: string
  config: Partial<AIConfiguration>
}

export const useUpdateConfiguration = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, config }: UpdateConfigurationVariables) =>
      aiConfigService.updateConfiguration(id, config),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['configurations'] })
      queryClient.invalidateQueries({ queryKey: ['configuration', variables.id] })
      toast.success(MESSAGES.SUCCESS.CONFIG.UPDATE)
    },
    onError: () => {
      toast.error(MESSAGES.ERROR.CONFIG.UPDATE)
    }
  })
}

export const useDeleteConfiguration = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: aiConfigService.deleteConfiguration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configurations'] })
      toast.success(MESSAGES.SUCCESS.CONFIG.DELETE)
    },
    onError: () => {
      toast.error(MESSAGES.ERROR.CONFIG.DELETE)
    }
  })
}

export const useActivateConfiguration = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: aiConfigService.activateConfiguration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configurations'] })
      queryClient.invalidateQueries({ queryKey: ['activeConfiguration'] })
      toast.success(MESSAGES.SUCCESS.CONFIG.ACTIVATE)
    },
    onError: () => {
      toast.error(MESSAGES.ERROR.CONFIG.ACTIVATE)
    }
  })
}

export const useTestConfiguration = () => {
  return useMutation({
    mutationFn: aiConfigService.testConfiguration,
    onSuccess: () => {
      toast.success(MESSAGES.SUCCESS.CONFIG.TEST)
    },
    onError: () => {
      toast.error(MESSAGES.ERROR.CONFIG.TEST)
    }
  })
}
