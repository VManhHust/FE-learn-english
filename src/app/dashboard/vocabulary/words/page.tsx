'use client'

import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Heart, Search, Volume2, X } from 'lucide-react'
import TopicsHeader from '@/components/layout/TopicsHeader'
import Sidebar from '@/components/layout/Sidebar'
import { VocabularySectionNav } from '@/components/vocabulary/VocabularySectionNav'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useLang } from '@/lib/i18n/LangProvider'
import { vocabularyI18n } from '@/lib/i18n/vocabulary'
import { vocabularyI18n_en } from '@/lib/i18n/vocabulary_en'
import { vocabularyApi, type VocabularyWordCard } from '@/lib/api/vocabulary'
import { vocabularyBankApi, type VocabularyBankEntry } from '@/lib/api/vocabularyBank'

type WordFilter = 'all' | 'unlearned' | 'not-mastered' | 'mastered' | 'saved'

export default function VocabularyWordsPage() {
  const { lang } = useLang()
  const v = lang === 'en' ? vocabularyI18n_en : vocabularyI18n
  const [words, setWords] = useState<VocabularyWordCard[]>([])
  const [savedEntries, setSavedEntries] = useState<VocabularyBankEntry[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<WordFilter>('all')
  const [limit, setLimit] = useState(20)
  const [loading, setLoading] = useState(true)
  const [savingWordId, setSavingWordId] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([vocabularyApi.getWords(), vocabularyBankApi.list(0, 1000)])
      .then(([wordData, savedData]) => { setWords(wordData); setSavedEntries(savedData.content) })
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => setLimit(20), [filter, search])

  const savedByName = useMemo(() => new Map(savedEntries.map((entry) => [entry.word.trim().toLocaleLowerCase('en'), entry])), [savedEntries])
  const filteredWords = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(lang)
    return words.filter((word) => {
      const saved = savedByName.has(word.word.trim().toLocaleLowerCase('en'))
      const matchesSearch = !query || word.word.toLocaleLowerCase('en').includes(query) || word.vietnameseTranslation.toLocaleLowerCase('vi').includes(query) || word.englishDefinition.toLocaleLowerCase('en').includes(query)
      const matchesFilter = filter === 'all' || (filter === 'unlearned' && word.learningStatus === 'UNLEARNED') || (filter === 'not-mastered' && word.learningStatus === 'NOT_MASTERED') || (filter === 'mastered' && word.learningStatus === 'MASTERED') || (filter === 'saved' && saved)
      return matchesSearch && matchesFilter
    })
  }, [filter, lang, savedByName, search, words])

  const playWord = (word: VocabularyWordCard) => {
    const audioUrl = word.audioUsUrl ?? word.audioUkUrl
    if (audioUrl) return void new Audio(audioUrl).play()
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word.word)
      utterance.lang = 'en-US'
      window.speechSynthesis.speak(utterance)
    }
  }

  const toggleSaved = async (word: VocabularyWordCard) => {
    if (savingWordId !== null) return
    const saved = savedByName.get(word.word.trim().toLocaleLowerCase('en'))
    setSavingWordId(word.id)
    try {
      if (saved) {
        await vocabularyBankApi.delete(saved.id)
        setSavedEntries((entries) => entries.filter((entry) => entry.id !== saved.id))
      } else {
        const entry = await vocabularyBankApi.save(word.word)
        setSavedEntries((entries) => [...entries, entry])
      }
    } finally { setSavingWordId(null) }
  }

  const filters = [
    { value: 'all' as const, label: v.all }, { value: 'unlearned' as const, label: v.unlearned },
    { value: 'not-mastered' as const, label: v.notMastered }, { value: 'mastered' as const, label: v.mastered },
    { value: 'saved' as const, label: v.saved },
  ]

  return <div className="flex h-screen flex-col overflow-hidden bg-[#f5f3ef] dark:bg-[#0f0e0c]">
    <TopicsHeader />
    <div className="flex min-h-0 flex-1"><Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto"><div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div><h1 className="text-2xl font-bold text-[#24284f] dark:text-[#e8e3d8]">{v.vocabularyList}</h1><p className="mt-1 text-sm text-[#6b7280] dark:text-[#aaa497]">{v.vocabularyListSubtitle}</p></div>
          <Badge variant="outline" className="rounded-full border-[#d4a853]/50 bg-[#fff8e8] px-3 py-1 text-[#9a6b18] dark:bg-[#2a2115] dark:text-[#d4b05a]">{filteredWords.length} {v.words}</Badge>
        </header>
        <VocabularySectionNav lang={lang} />
        <div className="sticky top-[4.75rem] z-20 rounded-2xl border border-[#ded8cc] bg-white/90 p-4 shadow-sm backdrop-blur-xl dark:border-[#34312d] dark:bg-[#171614]/90">
          <div className="relative"><Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#9f998c]" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={lang === 'vi' ? 'Tìm từ vựng hoặc nghĩa tiếng Việt...' : 'Search words or definitions...'} className="h-11 rounded-xl border-[#ded8cc] bg-[#faf8f3] pl-11 pr-11 dark:border-[#34312d] dark:bg-[#12110f]" />{search && <Button variant="ghost" size="icon" onClick={() => setSearch('')} className="absolute right-1 top-1/2 size-9 -translate-y-1/2"><X className="size-4" /></Button>}</div>
          <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{filters.map((item) => <Button key={item.value} variant="outline" size="sm" onClick={() => setFilter(item.value)} className={filter === item.value ? 'shrink-0 rounded-full border-[#d4a853] bg-[#fff8e8] px-4 text-[#9a6b18] dark:bg-[#2a2115] dark:text-[#d4b05a]' : 'shrink-0 rounded-full border-[#ded8cc] bg-white px-4 dark:border-[#34312d] dark:bg-[#171614]'}>{item.label}</Button>)}</div>
        </div>
        <div className="mt-5 space-y-3">
          {loading && Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-xl" />)}
          {!loading && filteredWords.length === 0 && <div className="rounded-2xl border border-dashed border-[#d8d1c4] bg-white px-6 py-16 text-center dark:border-[#34312d] dark:bg-[#171614]"><BookOpen className="mx-auto size-10 text-[#b9b1a2]" /><h2 className="mt-4 font-bold text-[#24284f] dark:text-[#e8e3d8]">{v.noVocabularyFound}</h2><p className="mt-1 text-sm text-[#7a7060]">{v.noVocabularyFoundSubtitle}</p></div>}
          {!loading && filteredWords.slice(0, limit).map((word) => {
            const saved = savedByName.has(word.word.trim().toLocaleLowerCase('en'))
            const status = word.learningStatus === 'MASTERED' ? { label: v.mastered, color: '#3f8f65' } : word.learningStatus === 'NOT_MASTERED' ? { label: v.notMastered, color: '#b8832e' } : { label: v.unlearned, color: '#7a7060' }
            return <article key={word.id} className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-[#ded8cc] bg-white px-5 py-4 transition hover:-translate-y-0.5 hover:border-[#d4a853]/60 hover:shadow-md sm:flex-row sm:items-center sm:justify-between dark:border-[#34312d] dark:bg-[#171614]"><span className="absolute inset-y-4 left-0 w-1 rounded-r-full" style={{ backgroundColor: status.color }} /><div className="min-w-0 pl-2"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-[#24284f] dark:text-[#e8e3d8]">{word.word}</h2><Badge variant="outline" className="rounded-full text-[10px]" style={{ borderColor: `${status.color}55`, color: status.color }}>{status.label}</Badge></div><p className="mt-0.5 text-xs text-[#7a7060] dark:text-[#9f998c]">{word.ipaUs ?? word.ipaUk ?? v.noPhonetic}</p><p className="mt-2 text-sm text-[#4b5563] dark:text-[#b8b2a6]">{lang === 'vi' ? word.vietnameseTranslation : word.englishDefinition}</p></div><div className="flex shrink-0 gap-2 pl-2"><Button variant="outline" size="icon" disabled={savingWordId === word.id} onClick={() => void toggleSaved(word)} className={saved ? 'border-[#d4a853] bg-[#fff8e8] text-[#b8832e] dark:bg-[#2a2115]' : 'border-[#ded8cc] dark:border-[#34312d]'}><Heart className={`size-4 ${saved ? 'fill-current' : ''}`} /></Button><Button variant="outline" size="icon" onClick={() => playWord(word)} className="border-[#ded8cc] hover:border-[#d4a853] hover:text-[#b8832e] dark:border-[#34312d]"><Volume2 className="size-4" /></Button></div></article>
          })}
        </div>
        {!loading && filteredWords.length > limit && <div className="mt-6 flex justify-center"><Button variant="outline" onClick={() => setLimit((value) => value + 20)} className="rounded-xl border-[#ded8cc] bg-white px-8 hover:border-[#d4a853] hover:bg-[#fff8e8] dark:border-[#34312d] dark:bg-[#171614]">{v.showMore} {Math.min(20, filteredWords.length - limit)} {v.words}</Button></div>}
      </div></main>
    </div>
  </div>
}
