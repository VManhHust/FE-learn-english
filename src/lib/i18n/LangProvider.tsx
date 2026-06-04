'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import vi from './vi'
import en from './en'

export type Lang = 'vi' | 'en'
export type Translations = typeof vi

const translations: Record<Lang, Translations> = { vi, en }

const LangContext = createContext<{
  lang: Lang
  setLang: (lang: Lang) => void
  t: Translations
}>({ lang: 'vi', setLang: () => {}, t: vi })

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('vi')

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null
    if (saved === 'vi' || saved === 'en') {
      setLangState(saved)
    }
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('lang', l)
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
