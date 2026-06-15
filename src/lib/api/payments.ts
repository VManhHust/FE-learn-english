import { axiosInstance } from '@/lib/auth/authClient'

export type PaymentOrderStatus = 'PENDING' | 'PAID' | 'EXPIRED'
export type ProPlanCode = 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'LIFETIME'

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
  proExpiresAt?: string
}

export interface ProStatus {
  pro: boolean
  proExpiresAt?: string
}

export const paymentApi = {
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
