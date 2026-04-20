'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { axiosInstance } from '@/lib/auth/authClient'

interface Segment {
  id?: number
  segmentIndex: number
  startTime: number
  endTime: number
  text: string
  translation: string
}

interface Lesson {
  id: number
  title: string
}

function emptySegment(index: number): Segment {
  return { segmentIndex: index, startTime: 0, endTime: 2, text: '', translation: '' }
}

/** Convert "mm:ss" or "ss" string to seconds */
function parseTime(val: string): number {
  const parts = val.trim().split(':')
  if (parts.length === 2) {
    const m = parseInt(parts[0]) || 0
    const s = parseFloat(parts[1]) || 0
    return m * 60 + s
  }
  return parseFloat(val) || 0
}

/** Format seconds to "mm:ss" */
function formatTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = (secs % 60).toFixed(1).padStart(4, '0')
  return `${m}:${s}`
}

export default function TranscriptEditorPage() {
  const params = useParams()
  const lessonId = params.id as string

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [segments, setSegments] = useState<Segment[]>([emptySegment(0)])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    Promise.all([
      axiosInstance.get<Lesson>(`/api/lessons/${lessonId}`),
      axiosInstance.get<Segment[]>(`/api/admin/lessons/${lessonId}/transcript`),
    ])
      .then(([lessonRes, transcriptRes]) => {
        setLesson(lessonRes.data)
        if (transcriptRes.data.length > 0) {
          setSegments(transcriptRes.data)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [lessonId])

  const addRow = () => {
    setSegments(prev => [...prev, emptySegment(prev.length)])
  }

  const removeRow = (idx: number) => {
    setSegments(prev => {
      const next = prev.filter((_, i) => i !== idx)
      return next.map((s, i) => ({ ...s, segmentIndex: i }))
    })
  }

  const updateField = <K extends keyof Segment>(idx: number, field: K, value: Segment[K]) => {
    setSegments(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await axiosInstance.post(`/api/admin/lessons/${lessonId}/transcript`, segments)
      setMessage({ type: 'success', text: 'Lưu transcript thành công!' })
    } catch {
      setMessage({ type: 'error', text: 'Lưu thất bại, vui lòng thử lại.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm('Xóa toàn bộ transcript?')) return
    setSaving(true)
    setMessage(null)
    try {
      await axiosInstance.delete(`/api/admin/lessons/${lessonId}/transcript`)
      setSegments([emptySegment(0)])
      setMessage({ type: 'success', text: 'Đã xóa toàn bộ transcript.' })
    } catch {
      setMessage({ type: 'error', text: 'Xóa thất bại, vui lòng thử lại.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/admin/lessons`} className="text-sm text-gray-500 hover:underline">
          ← Quay lại
        </Link>
        <h1 className="text-xl font-bold text-gray-800">
          Chỉnh sửa Transcript — {lesson?.title ?? `Bài ${lessonId}`}
        </h1>
      </div>

      {/* Notification */}
      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-3 py-2 text-center w-10">#</th>
              <th className="px-3 py-2 text-left w-32">Start (mm:ss)</th>
              <th className="px-3 py-2 text-left w-32">End (mm:ss)</th>
              <th className="px-3 py-2 text-left">Text</th>
              <th className="px-3 py-2 text-left">Translation</th>
              <th className="px-3 py-2 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {segments.map((seg, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-center text-gray-400">{idx + 1}</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={seg.startTime}
                    onChange={e => updateField(idx, 'startTime', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={seg.endTime}
                    onChange={e => updateField(idx, 'endTime', parseFloat(e.target.value) || 2)}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </td>
                <td className="px-3 py-2">
                  <textarea
                    rows={2}
                    value={seg.text}
                    onChange={e => updateField(idx, 'text', e.target.value)}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={seg.translation}
                    onChange={e => updateField(idx, 'translation', e.target.value)}
                    placeholder="(tuỳ chọn)"
                    className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => removeRow(idx)}
                    className="text-red-400 hover:text-red-600 text-lg leading-none"
                    title="Xóa dòng"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={addRow}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          + Thêm câu
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Đang lưu...' : 'Lưu tất cả'}
        </button>
        <button
          onClick={handleDeleteAll}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium hover:bg-red-100 disabled:opacity-50"
        >
          Xóa tất cả
        </button>
      </div>
    </div>
  )
}
