import { axiosInstance } from '@/lib/auth/authClient'

export type PaymentOrderStatus = 'PENDING' | 'PAID' | 'EXPIRED'
export type ProPlanCode = string

export interface ProPlan {
  id: number
  code: ProPlanCode
  name: string
  description?: string
  amount: number
  durationDays?: number | null
  benefits?: string
  specialBenefits?: string
  status: 'ACTIVE' | 'INACTIVE'
  featured?: boolean
  sortOrder: number
}

export interface PaymentOrder {
  orderId: string
  planCode: ProPlanCode
  planName: string
  amount: number
  currency: 'VND'
  status: PaymentOrderStatus
  paymentCode: string
  qrCodeUrl: string
  bank: string
  accountNumber: string
  accountHolder?: string
  expiresAt: string
  paidAt?: string
  proStartsAt?: string
  proExpiresAt?: string
}

export interface ProStatus {
  pro: boolean
  currentPlanCode?: ProPlanCode
  currentPlanName?: string
  proStartsAt?: string
  proExpiresAt?: string
}

export const paymentApi = {
  async getProPlans(): Promise<ProPlan[]> {
    const response = await axiosInstance.get<ProPlan[]>('/api/v1/payments/pro/plans')
    return response.data
  },

  async createProOrder(planCode: ProPlanCode): Promise<PaymentOrder> {
    const response = await axiosInstance.post<PaymentOrder>('/api/v1/payments/pro/orders', { planCode })
    return response.data
  },

  async getOrder(orderId: string): Promise<PaymentOrder> {
    const response = await axiosInstance.get<PaymentOrder>(`/api/v1/payments/orders/${orderId}`)
    return response.data
  },

  async getProStatus(): Promise<ProStatus> {
    const response = await axiosInstance.get<ProStatus>('/api/v1/payments/pro/status')
    return response.data
  },
}
