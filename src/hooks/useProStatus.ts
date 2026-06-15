'use client'

import { useEffect, useState } from 'react'
import { paymentApi } from '@/lib/api/payments'

export function useProStatus() {
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const handleStatusChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ pro?: boolean }>
      if (typeof customEvent.detail?.pro === 'boolean') {
        setIsPro(customEvent.detail.pro)
      }
    }
    window.addEventListener('pro-status-changed', handleStatusChange)

    paymentApi.getProStatus()
      .then((status) => {
        if (active) setIsPro(status.pro)
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      window.removeEventListener('pro-status-changed', handleStatusChange)
    }
  }, [])

  return { isPro, loading, setIsPro }
}
