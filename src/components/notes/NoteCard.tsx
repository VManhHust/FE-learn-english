'use client'

import { VideoNoteResponse } from '@/types/video-note'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useState } from 'react'

interface NoteCardProps {
  note: VideoNoteResponse
  onUpdate: (noteId: number, newContent: string) => Promise<void>
  onDelete: (noteId: number) => Promise<void>
}

export default function NoteCard({ note, onUpdate, onDelete }: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(note.noteContent)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const formattedDate = formatDistanceToNow(new Date(note.createdAt), {
    addSuffix: true,
    locale: vi
  })

  const handleSave = async () => {
    if (editContent.trim() === note.noteContent.trim()) {
      setIsEditing(false)
      return
    }

    try {
      setIsSaving(true)
      await onUpdate(note.id, editContent.trim())
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update note:', error)
      alert('Không thể cập nhật ghi chú. Vui lòng thử lại.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa ghi chú này?')) {
      return
    }

    try {
      setIsDeleting(true)
      await onDelete(note.id)
    } catch (error) {
      console.error('Failed to delete note:', error)
      alert('Không thể xóa ghi chú. Vui lòng thử lại.')
      setIsDeleting(false)
    }
  }

  const handleCancel = () => {
    setEditContent(note.noteContent)
    setIsEditing(false)
  }

  if (isDeleting) {
    return (
      <div className="bg-white dark:bg-[#1a1d27] rounded-xl p-5 border border-gray-200 dark:border-[#2e3142] opacity-50">
        <p className="text-center text-sm text-gray-500">Đang xóa...</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#1a1d27] rounded-xl p-5 border border-gray-200 dark:border-[#2e3142] hover:shadow-lg transition-all">
      {/* Header: Video title + timestamp */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <a
            href={`/dashboard/learn/dictation/${note.videoId}`}
            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold text-base inline-flex items-center gap-1"
          >
            {note.videoTitle}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
          <p className="text-xs text-gray-400 mt-1">{formattedDate}</p>
        </div>
      </div>

      {/* English sentence */}
      <div className="mb-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Tiếng Anh:</p>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
          <p className="text-sm text-blue-900 dark:text-blue-300 font-medium">
            {note.englishText}
          </p>
        </div>
      </div>

      {/* Vietnamese translation */}
      {note.vietnameseText && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Tiếng Việt:</p>
          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700/30">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {note.vietnameseText}
            </p>
          </div>
        </div>
      )}

      {/* Note content */}
      <div className="border-t border-gray-200 dark:border-[#2e3142] pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Ghi chú:</p>
          {!isEditing && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(true)}
                title="Chỉnh sửa"
                className="text-gray-500 hover:text-[#c9a84c] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button
                onClick={handleDelete}
                title="Xóa"
                className="text-gray-500 hover:text-red-500 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              className="w-full rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#252836] border border-gray-200 dark:border-[#3a3d4f] text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-[#c9a84c] resize-none"
              placeholder="Nhập ghi chú của bạn..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !editContent.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#5dade2] text-white hover:bg-[#3498db] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-100 dark:border-yellow-800/30">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {note.noteContent}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
