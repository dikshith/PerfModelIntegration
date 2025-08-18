import axiosInstance from '@/lib/api/axios'
import { API_ENDPOINTS } from '@/lib/constants/endpoints'
import { AIConfiguration, AIConfigurationResponse, AIConfigurationTestResponse } from './types'

const unwrap = <T>(payload: any): T => (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload ? payload.data : payload)

export const aiConfigService = {
  getConfigurations: async (): Promise<AIConfigurationResponse> => {
    const response = await axiosInstance.get(API_ENDPOINTS.CONFIG.BASE)
    const data = unwrap<any>(response.data)
    // Ensure a consistent shape with total if backend returns a plain array
    if (Array.isArray(data)) {
      return { data, total: data.length }
    }
    return data
  },

  getConfiguration: async (id: string): Promise<AIConfiguration> => {
    const response = await axiosInstance.get(API_ENDPOINTS.CONFIG.BY_ID(id))
    return unwrap<AIConfiguration>(response.data)
  },

  getActiveConfiguration: async (): Promise<AIConfiguration> => {
    const response = await axiosInstance.get(API_ENDPOINTS.CONFIG.ACTIVE)
    return unwrap<AIConfiguration>(response.data)
  },

  createConfiguration: async (config: Omit<AIConfiguration, 'id'>): Promise<AIConfiguration> => {
    const response = await axiosInstance.post(API_ENDPOINTS.CONFIG.BASE, config)
    return unwrap<AIConfiguration>(response.data)
  },

  updateConfiguration: async (id: string, config: Partial<AIConfiguration>): Promise<AIConfiguration> => {
    const response = await axiosInstance.patch(API_ENDPOINTS.CONFIG.BY_ID(id), config)
    return unwrap<AIConfiguration>(response.data)
  },

  deleteConfiguration: async (id: string): Promise<void> => {
    await axiosInstance.delete(API_ENDPOINTS.CONFIG.BY_ID(id))
  },

  activateConfiguration: async (id: string): Promise<AIConfiguration> => {
    const response = await axiosInstance.post(API_ENDPOINTS.CONFIG.ACTIVATE(id))
    return unwrap<AIConfiguration>(response.data)
  },

  testConfiguration: async (id: string): Promise<AIConfigurationTestResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.CONFIG.TEST(id))
    return unwrap<AIConfigurationTestResponse>(response.data)
  },

}