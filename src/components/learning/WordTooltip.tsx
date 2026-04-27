'use client'

import { useEffect, useRef, useState } from 'react'
import { vocabularyBankApi } from '@/lib/api/vocabularyBank'

interface WordTooltipProps {
  word: string
  children: React.ReactNode
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'duplicate' | 'error'

function buildDictionaryUrl(word: string) {
  const normalized = word.toLowerCase().trim()
  return {
    oxford: `https://www.oxfordlearnersdictionaries.com/definition/english/${normalized}`,
    cambridge: `https://dictionary.cambridge.org/dictionary/english/${normalized}`,
  }
}

export function WordTooltip({ word, children, isOpen, onOpen, onClose }: WordTooltipProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [showDict, setShowDict] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, align: 'center' as 'center' | 'left' | 'right' })
  const closeTimeoutRef = useRef<NodeJS.Timeout>()
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const hasSpeechSupport = typeof window !== 'undefined' && 'speechSynthesis' in window

  const urls = buildDictionaryUrl(word)

  // Calculate tooltip position using fixed positioning
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tooltipWidth = 208 // w-52 = 13rem = 208px
      const tooltipHeight = 200 // approximate height
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      // Calculate horizontal position
      const centerPosition = triggerRect.left + triggerRect.width / 2
      const leftEdge = centerPosition - tooltipWidth / 2
      const rightEdge = centerPosition + tooltipWidth / 2
      
      let left = centerPosition
      let align: 'center' | 'left' | 'right' = 'center'
      
      if (leftEdge < 8) {
        // Too close to left edge - align left
        left = triggerRect.left
        align = 'left'
      } else if (rightEdge > viewportWidth - 8) {
        // Too close to right edge - align right
        left = triggerRect.right
        align = 'right'
      }
      
      // Calculate vertical position (above the word)
      let top = triggerRect.top - 8 // 8px gap above word
      
      // If not enough space above, show below
      if (top < tooltipHeight + 8) {
        top = triggerRect.bottom + 8
      }
      
      setTooltipPosition({ top, left, align })
    }
  }, [isOpen])

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    onOpen()
  }

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      onClose()
      setShowDict(false)
    }, 200)
  }

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    }
  }, [])

  const handleSave = async () => {
    if (saveStatus === 'saved' || saveStatus === 'saving') return
    setSaveStatus('saving')
    try {
      await vocabularyBankApi.save(word)
      setSaveStatus('saved')
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setSaveStatus('duplicate')
      } else {
        setSaveStatus('error')
      }
    }
  }

  const handleSpeak = () => {
    if (!hasSpeechSupport) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'en-US'
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <span
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {isOpen && (
        <div
          ref={tooltipRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="fixed w-52 rounded-xl shadow-xl border border-gray-200 dark:border-[#2e3142] bg-white dark:bg-[#1a1d27] p-3 flex flex-col gap-2"
          style={{
            zIndex: 9999,
            minWidth: 200,
            top: `${tooltipPosition.top}px`,
            left: tooltipPosition.align === 'center' ? `${tooltipPosition.left}px` : tooltipPosition.align === 'left' ? `${tooltipPosition.left}px` : 'auto',
            right: tooltipPosition.align === 'right' ? `${window.innerWidth - tooltipPosition.left}px` : 'auto',
            transform: tooltipPosition.align === 'center' ? 'translate(-50%, -100%)' : tooltipPosition.align === 'left' ? 'translateY(-100%)' : 'translateY(-100%)',
          }}
        >
          {/* Word label */}
          <p className="text-xs font-bold text-gray-800 dark:text-gray-100 text-center border-b border-gray-100 dark:border-[#2e3142] pb-2">
            {word}
          </p>

          {/* Save to vocabulary */}
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving' || saveStatus === 'saved' || saveStatus === 'duplicate'}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors w-full text-left"
            style={{
              backgroundColor:
                saveStatus === 'saved' ? 'rgba(74,222,128,0.15)' :
                saveStatus === 'duplicate' ? 'rgba(251,191,36,0.15)' :
                saveStatus === 'error' ? 'rgba(248,113,113,0.15)' :
                'rgba(201,168,76,0.1)',
              color:
                saveStatus === 'saved' ? '#4ade80' :
                saveStatus === 'duplicate' ? '#fbbf24' :
                saveStatus === 'error' ? '#f87171' :
                '#c9a84c',
            }}
          >
            {saveStatus === 'saving' && (
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {saveStatus === 'saved' && <span>✓</span>}
            {saveStatus === 'duplicate' && <span>★</span>}
            {saveStatus === 'error' && <span>✕</span>}
            {(saveStatus === 'idle') && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            )}
            <span>
              {saveStatus === 'saved' ? 'Đã lưu' :
               saveStatus === 'duplicate' ? 'Đã có trong kho' :
               saveStatus === 'error' ? 'Lỗi, thử lại' :
               saveStatus === 'saving' ? 'Đang lưu...' :
               'Lưu vào kho từ vựng'}
            </span>
          </button>

          {/* Pronunciation */}
          {hasSpeechSupport ? (
            <button
              onClick={handleSpeak}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors w-full text-left hover:bg-gray-100 dark:hover:bg-[#252836] text-gray-700 dark:text-gray-300"
            >
              {isSpeaking ? (
                <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              )}
              <span>{isSpeaking ? 'Đang phát...' : 'Phát âm'}</span>
            </button>
          ) : (
            <p className="text-xs text-gray-400 px-3">Trình duyệt không hỗ trợ phát âm</p>
          )}

          {/* Dictionary links */}
          <div>
            <button
              onClick={() => setShowDict(v => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors w-full text-left hover:bg-gray-100 dark:hover:bg-[#252836] text-gray-700 dark:text-gray-300"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              <span>Từ điển</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 'auto', transform: showDict ? 'rotate(180deg)' : 'none' }}>
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            </button>
            {showDict && (
              <div className="flex flex-col gap-1 mt-1 pl-3">
                <a
                  href={urls.oxford}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                >
                  <span>📖</span> Oxford
                </a>
                <a
                  href={urls.cambridge}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                >
                  <span>📚</span> Cambridge
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </span>
  )
}
