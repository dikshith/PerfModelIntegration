export const MESSAGES = {
  SUCCESS: {
    CONFIG: {
      CREATE: 'Configuration created successfully',
      UPDATE: 'Configuration updated successfully',
      DELETE: 'Configuration deleted successfully',
      ACTIVATE: 'Configuration activated successfully',
      TEST: 'Configuration test completed successfully',
    },
    CHAT: {
      SEND: 'Message sent successfully',
      DELETE: 'Chat history deleted successfully',
      UPLOAD_KNOWLEDGE: 'Knowledge base uploaded successfully',
      DELETE_KNOWLEDGE: 'Knowledge base deleted successfully',
      CLEAR_KNOWLEDGE: 'Knowledge base cleared successfully',
    },
    REPORTS: {
      GENERATE: 'Report generated successfully',
      DOWNLOAD: 'Report downloaded successfully',
    }
  },
  ERROR: {
    CONFIG: {
      CREATE: 'Failed to create configuration',
      UPDATE: 'Failed to update configuration',
      DELETE: 'Failed to delete configuration',
      ACTIVATE: 'Failed to activate configuration',
      TEST: 'Failed to test configuration',
      FETCH: 'Failed to fetch configurations',
    },
    CHAT: {
      SEND: 'Failed to send message',
      DELETE: 'Failed to delete chat history',
      FETCH: 'Failed to fetch chat history',
      UPLOAD_KNOWLEDGE: 'Failed to upload knowledge base',
      DELETE_KNOWLEDGE: 'Failed to delete knowledge base',
      CLEAR_KNOWLEDGE: 'Failed to clear knowledge base',
    },
    ANALYTICS: {
      FETCH: 'Failed to fetch analytics data',
    },
    REPORTS: {
      GENERATE: 'Failed to generate report',
      DOWNLOAD: 'Failed to download report',
      FETCH: 'Failed to fetch reports',
    }
  },
} as const 