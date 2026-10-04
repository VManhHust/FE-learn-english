import { cookies } from 'next/headers'
import type { Lang } from './LangProvider'

export async function getLocale(): Promise<Lang> {
  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value
  if (lang === 'en') return 'en'
  return 'vi'
}
