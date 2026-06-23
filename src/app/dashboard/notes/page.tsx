'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import NoteCard from '@/components/notes/NoteCard'
import { VideoNoteResponse } from '@/types/video-note'
import { fetchVideoNotes, updateVideoNote, deleteVideoNote } from '@/lib/api/video-notes'
import { useLang } from '@/lib/i18n/LangProvider'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const notesI18n = {
  vi: {
    title: 'Ghi chú của tôi',
    noteCount: (n: number) => `${n} ghi chú`,
    loading: 'Đang tải...',
    emptyTitle: 'Bạn chưa có ghi chú nào',
    emptySubtitle: 'Hãy tạo ghi chú khi xem video để ghi lại những điểm quan trọng',
    noteCountBadge: (n: number) => `${n} ghi chú`,
    viewLesson: 'Xem bài học',
    prev: '← Trước',
    next: 'Tiếp →',
    page: (cur: number, total: number) => `Trang ${cur} / ${total}`,
    errorLoad: 'Không thể tải danh sách ghi chú',
  },
  en: {
    title: 'My Notes',
    noteCount: (n: number) => `${n} notes`,
    loading: 'Loading...',
    emptyTitle: 'You have no notes yet',
    emptySubtitle: 'Create notes while watching videos to record important points',
    noteCountBadge: (n: number) => `${n} notes`,
    viewLesson: 'View lesson',
    prev: '← Prev',
    next: 'Next →',
    page: (cur: number, total: number) => `Page ${cur} / ${total}`,
    errorLoad: 'Unable to load notes',
  },
}

interface GroupedNotes {
  videoId: number
  videoTitle: string
  notes: VideoNoteResponse[]
}

const NOTES_PER_PAGE = 5

export default function NotesPage() {
  const { isAuthenticated } = useAuth()
  const { lang } = useLang()
  const t = notesI18n[lang]
  const [notes, setNotes] = useState<VideoNoteResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedVideos, setExpandedVideos] = useState<Set<number>>(new Set())
  const [videoPagination, setVideoPagination] = useState<Record<number, number>>({})

  useEffect(() => {
    if (!isAuthenticated) return
    
    const loadNotes = async () => {
      try {
        setLoading(true)
        const data = await fetchVideoNotes()
        setNotes(data.content)
      } catch (err) {
        setError(t.errorLoad)
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    loadNotes()
  }, [isAuthenticated])

  // Group notes by video
  const groupedNotes: GroupedNotes[] = notes.reduce((acc, note) => {
    const existingGroup = acc.find(g => g.videoId === note.videoId)
    if (existingGroup) {
      existingGroup.notes.push(note)
    } else {
      acc.push({
        videoId: note.videoId,
        videoTitle: note.videoTitle,
        notes: [note]
      })
    }
    return acc
  }, [] as GroupedNotes[])

  const toggleVideo = (videoId: number) => {
    setExpandedVideos(prev => {
      const newSet = new Set(prev)
      if (newSet.has(videoId)) {
        newSet.delete(videoId)
      } else {
        newSet.add(videoId)
        // Initialize pagination for this video if not exists
        if (!videoPagination[videoId]) {
          setVideoPagination(p => ({ ...p, [videoId]: 0 }))
        }
      }
      return newSet
    })
  }

  const handleUpdateNote = async (noteId: number, newContent: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return

    const updatedNote = await updateVideoNote(noteId, {
      exerciseModuleId: 0,
      noteContent: newContent
    })

    setNotes(prevNotes => 
      prevNotes.map(n => n.id === noteId ? updatedNote : n)
    )
  }

  const handleDeleteNote = async (noteId: number) => {
    await deleteVideoNote(noteId)
    setNotes(prevNotes => prevNotes.filter(n => n.id !== noteId))
  }

  const changePage = (videoId: number, newPage: number) => {
    setVideoPagination(prev => ({ ...prev, [videoId]: newPage }))
  }

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        <div className="text-center py-12">
          <Skeleton className="inline-block w-8 h-8 rounded-full" />
          <p className="text-gray-500 mt-3 text-sm sm:text-base">{t.loading}</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="max-w-5xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        <div className="text-center py-12">
          <p className="text-red-500 text-sm sm:text-base">{error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 bg-[#f5f3ef] dark:bg-[#0f0e0c] min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t.title}
        </h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {t.noteCount(notes.length)}
        </span>
      </div>
      
      {groupedNotes.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-[#fffdf8] to-[#fff5dc] py-12 text-center shadow-sm sm:py-16 dark:border-[#66502b] dark:from-[#211e18] dark:via-[#191713] dark:to-[#2a2115] dark:shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
          <div className="pointer-events-none absolute -left-20 -top-20 size-56 rounded-full bg-[#d4a853]/10 blur-3xl" />
          <div className="relative mx-auto mb-5 flex size-16 items-center justify-center rounded-full border border-[#dfc994] bg-[#fff8e8] text-[#b8832e] shadow-[0_8px_24px_rgba(180,127,29,0.15)] ring-8 ring-[#fff4d8]/50 dark:border-[#66502b] dark:bg-[#2a2115] dark:text-[#d4b05a] dark:ring-[#594526]/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#b8832e] sm:h-8 sm:w-8 dark:text-[#d4b05a]">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
          <p className="relative mb-2 text-base font-bold text-[#24284f] dark:text-[#eee8dc] sm:text-lg">{t.emptyTitle}</p>
          <p className="relative px-4 text-xs text-[#7a7060] dark:text-[#aaa397] sm:text-sm">
            {t.emptySubtitle}
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {groupedNotes.map((group) => {
            const isExpanded = expandedVideos.has(group.videoId)
            const currentPage = videoPagination[group.videoId] || 0
            const totalPages = Math.ceil(group.notes.length / NOTES_PER_PAGE)
            const startIdx = currentPage * NOTES_PER_PAGE
            const endIdx = startIdx + NOTES_PER_PAGE
            const paginatedNotes = group.notes.slice(startIdx, endIdx)

            return (
              <div key={group.videoId} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-[#66502b] dark:bg-gradient-to-br dark:from-[#211e18] dark:via-[#191713] dark:to-[#2a2115] dark:shadow-[0_14px_36px_rgba(0,0,0,0.24)]">
                {/* Video header - clickable to expand/collapse */}
                <div className="flex items-stretch">
                  {/* Left side - expand/collapse button */}
                  <button
                    onClick={() => toggleVideo(group.videoId)}
                    className="flex flex-1 items-center gap-3 p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-[#2a2115]/70"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#d4a853] to-[#b8832e] shadow-sm dark:from-[#d4b05a] dark:to-[#9a6b18]">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {group.videoTitle}
                      </h3>
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        className={`text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                      >
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {t.noteCountBadge(group.notes.length)}
                    </p>
                  </button>
                  
                  {/* Right side - link to lesson */}
                  <a
                    href={`/dashboard/learn/dictation/${group.videoId}`}
                    className="group flex items-center justify-center border-l border-gray-200 px-4 transition-colors hover:bg-gray-50 dark:border-[#594526] dark:hover:bg-[#2a2115]/70"
                    title={t.viewLesson}
                  >
                    <svg 
                      width="18" 
                      height="18" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="text-gray-400 group-hover:text-[#d4a853] transition-colors"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </a>
                </div>

                {/* Expanded notes */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-[#594526]">
                    <div className="p-4 space-y-3">
                      {paginatedNotes.map((note) => (
                        <NoteCard 
                          key={note.id} 
                          note={note}
                          onUpdate={handleUpdateNote}
                          onDelete={handleDeleteNote}
                        />
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-200 dark:border-[#1f1f1f]">
                        <Button
                          variant="outline"
                          onClick={() => changePage(group.videoId, currentPage - 1)}
                          disabled={currentPage === 0}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-[#1a1917] border-gray-200 dark:border-[#2e3142] text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {t.prev}
                        </Button>
                        
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t.page(currentPage + 1, totalPages)}
                        </span>

                        <Button
                          variant="outline"
                          onClick={() => changePage(group.videoId, currentPage + 1)}
                          disabled={currentPage >= totalPages - 1}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-[#1a1917] border-gray-200 dark:border-[#2e3142] text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {t.next}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
