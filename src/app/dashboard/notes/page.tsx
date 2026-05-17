'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import NoteCard from '@/components/notes/NoteCard'
import { VideoNoteResponse } from '@/types/video-note'
import { fetchVideoNotes, updateVideoNote, deleteVideoNote } from '@/lib/api/video-notes'

export default function NotesPage() {
  const { isAuthenticated } = useAuth()
  const [notes, setNotes] = useState<VideoNoteResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const handleUpdateNote = async (noteId: number, newContent: string) => {
    // Find the note to get exerciseModuleId
    const note = notes.find(n => n.id === noteId)
    if (!note) return

    const updatedNote = await updateVideoNote(noteId, {
      exerciseModuleId: 0, // Backend doesn't use this for updates, but required by type
      noteContent: newContent
    })

    // Update local state
    setNotes(prevNotes => 
      prevNotes.map(n => n.id === noteId ? updatedNote : n)
    )
  }

  const handleDeleteNote = async (noteId: number) => {
    await deleteVideoNote(noteId)
    
    // Remove from local state
    setNotes(prevNotes => prevNotes.filter(n => n.id !== noteId))
  }

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-[#c9a84c] border-t-transparent rounded-full animate-spin"></div>
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
      
      {notes.length === 0 ? (
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
          {notes.map((note) => (
            <NoteCard 
              key={note.id} 
              note={note}
              onUpdate={handleUpdateNote}
              onDelete={handleDeleteNote}
            />
          ))}
        </div>
      )}
    </main>
  )
}
