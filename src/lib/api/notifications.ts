import { axiosInstance } from '@/lib/auth/authClient'

export type NotificationType =
  | 'VOCABULARY_REVIEW_DUE'
  | 'STREAK_REMINDER'
  | 'CONTINUE_LESSON'

export type NotificationPriority = 'NORMAL' | 'HIGH'

export interface LearningNotification {
  id: number
  type: NotificationType
  priority: NotificationPriority
  data: Record<string, unknown>
  actionUrl: string | null
  unread: boolean
  readAt: string | null
  createdAt: string
  expiresAt: string | null
}

export interface NotificationListResponse {
  items: LearningNotification[]
  unreadCount: number
  hasMore: boolean
}

export const notificationsApi = {
  async getNotifications(params: {
    offset?: number
    limit?: number
    unreadOnly?: boolean
    includeExpired?: boolean
  } = {}): Promise<NotificationListResponse> {
    const response = await axiosInstance.get<NotificationListResponse>(
      '/api/v1/notifications',
      { params },
    )
    return response.data
  },

  async getUnreadCount(): Promise<number> {
    const response = await axiosInstance.get<{ unreadCount: number }>(
      '/api/v1/notifications/unread-count',
    )
    return response.data.unreadCount
  },

  async markAsRead(notificationId: number): Promise<LearningNotification> {
    const response = await axiosInstance.patch<LearningNotification>(
      `/api/v1/notifications/${notificationId}/read`,
    )
    return response.data
  },

  async markAllAsRead(): Promise<number> {
    const response = await axiosInstance.patch<{ unreadCount: number }>(
      '/api/v1/notifications/read-all',
    )
    return response.data.unreadCount
  },
}
