import { axiosInstance } from '@/lib/auth/authClient'

export interface StreakResponse {
  currentStreak: number
  checkedInToday: boolean
  totalCheckIns: number
  today: string
  checkedInDates: string[]
}

export const streakApi = {
  async getStatus(): Promise<StreakResponse> {
    const response = await axiosInstance.get<StreakResponse>('/api/v1/streak')
    return response.data
  },

  async checkIn(): Promise<StreakResponse> {
    const response = await axiosInstance.post<StreakResponse>(
      '/api/v1/streak/check-in',
      undefined
    )
    return response.data
  },
}
