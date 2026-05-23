'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import NoteCard from '@/components/notes/NoteCard'
import { VideoNoteResponse } from '@/types/video-note'
import { fetchVideoNotes, updateVideoNote, deleteVideoNote } from '@/lib/api/video-notes'

interface GroupedNotes {
  videoId: number
  videoTitle: string
  notes: VideoNoteResponse[]
}

const NOTES_PER_PAGE = 5

export default function NotesPage() {
  const { isAuthenticated } = useAuth()
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
        setError('Không thể tải danh sách ghi chú')
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
          <div className="inline-block w-8 h-8 border-4 border-[#d4a853] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 mt-3 text-sm sm:text-base">Đang tải...</p>
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
          Ghi chú của tôi
        </h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {notes.length} ghi chú
        </span>
      </div>
      
      {groupedNotes.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white dark:bg-[#1a1917] rounded-xl border border-gray-200 dark:border-[#1a1a1a]">
          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-8 sm:h-8 text-gray-400">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-2 font-medium text-sm sm:text-base">Bạn chưa có ghi chú nào</p>
          <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 px-4">
            Hãy tạo ghi chú khi xem video để ghi lại những điểm quan trọng
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
              <div key={group.videoId} className="bg-white dark:bg-[#1a1917] rounded-xl border border-gray-200 dark:border-[#1f1f1f] overflow-hidden">
                {/* Video header - clickable to expand/collapse */}
                <div className="flex items-stretch">
                  {/* Left side - expand/collapse button */}
                  <button
                    onClick={() => toggleVideo(group.videoId)}
                    className="flex items-center gap-3 p-4 flex-1 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
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
                      {group.notes.length} ghi chú
                    </p>
                  </button>
                  
                  {/* Right side - link to lesson */}
                  <a
                    href={`/dashboard/learn/dictation/${group.videoId}`}
                    className="flex items-center justify-center px-4 border-l border-gray-200 dark:border-[#1f1f1f] hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors group"
                    title="Xem bài học"
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
                  <div className="border-t border-gray-200 dark:border-[#1f1f1f]">
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
                        <button
                          onClick={() => changePage(group.videoId, currentPage - 1)}
                          disabled={currentPage === 0}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium border bg-white dark:bg-[#1a1917] border-gray-200 dark:border-[#2e3142] text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          ← Trước
                        </button>
                        
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Trang {currentPage + 1} / {totalPages}
                        </span>

                        <button
                          onClick={() => changePage(group.videoId, currentPage + 1)}
                          disabled={currentPage >= totalPages - 1}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium border bg-white dark:bg-[#1a1917] border-gray-200 dark:border-[#2e3142] text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Tiếp →
                        </button>
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
