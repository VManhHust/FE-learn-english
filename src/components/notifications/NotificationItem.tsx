'use client'

import {
  BookOpenText,
  ChevronRight,
  Flame,
  FolderOpen,
  Layers3,
  LibraryBig,
  PlayCircle,
  RotateCcw,
} from 'lucide-react'
import { formatDistanceToNowStrict } from 'date-fns'
import { enUS, vi } from 'date-fns/locale'
import { useLang } from '@/lib/i18n/LangProvider'
import type { LearningNotification } from '@/lib/api/notifications'
import { cn } from '@/lib/utils'

interface NotificationItemProps {
  notification: LearningNotification
  onActivate: (notification: LearningNotification) => void
  compact?: boolean
}

function numberValue(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

export default function NotificationItem({
  notification,
  onActivate,
  compact = false,
}: NotificationItemProps) {
  const { lang, t } = useLang()
  const n = t.header.notification
  const isUnread = notification.unread
  const isNewContent = notification.type.startsWith('NEW_')

  const content = (() => {
    if (notification.type === 'VOCABULARY_REVIEW_DUE') {
      const count = numberValue(notification.data.count)
      const minutes = numberValue(notification.data.estimatedMinutes, 1)
      const words = Array.isArray(notification.data.sampleWords)
        ? notification.data.sampleWords.filter((word): word is string => typeof word === 'string')
        : []
      return {
        icon: RotateCcw,
        title: lang === 'vi'
          ? `${count} từ đang chờ bạn ôn tập`
          : `${count} ${count === 1 ? 'word is' : 'words are'} ready to review`,
        description: lang === 'vi'
          ? `Khoảng ${minutes} phút để ghi nhớ lâu hơn.`
          : `About ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} to strengthen your memory.`,
        detail: words.join(' · '),
        action: n.reviewNow,
        iconClass: 'bg-[#fff1cf] text-[#b87919] dark:bg-[#3a2a14] dark:text-[#f2bd62]',
      }
    }

    if (notification.type === 'STREAK_REMINDER') {
      const currentStreak = numberValue(notification.data.currentStreak)
      return {
        icon: Flame,
        title: currentStreak > 0
          ? (lang === 'vi'
              ? `Giữ chuỗi ${currentStreak} ngày của bạn`
              : `Keep your ${currentStreak}-day streak going`)
          : n.streakStartTitle,
        description: currentStreak > 0 ? n.streakDescription : n.streakStartDescription,
        detail: '',
        action: n.checkInNow,
        iconClass: 'bg-[#fff0dc] text-[#e37b20] dark:bg-[#3b2416] dark:text-[#fb9b45]',
      }
    }

    if (notification.type === 'NEW_VOCABULARY_DECK') {
      const deckTitle = stringValue(notification.data.deckTitle, n.deckFallback)
      const category = stringValue(notification.data.category)
      const premium = notification.data.premium === true
      return {
        icon: Layers3,
        title: n.newVocabularyDeckTitle,
        description: lang === 'vi'
          ? `Khám phá bộ “${deckTitle}” vừa được cập nhật trên LinguaFlow.`
          : `Explore “${deckTitle}”, newly added to LinguaFlow.`,
        detail: [category, premium ? 'PRO' : ''].filter(Boolean).join(' · '),
        action: n.exploreNow,
        iconClass: 'bg-[#f2eaff] text-[#7d56b3] dark:bg-[#2c203d] dark:text-[#bb91ee]',
      }
    }

    if (notification.type === 'NEW_VOCABULARY_TOPIC') {
      const topicTitle = stringValue(notification.data.topicTitle, n.topicFallback)
      const deckTitle = stringValue(notification.data.deckTitle, n.deckFallback)
      return {
        icon: LibraryBig,
        title: n.newVocabularyTopicTitle,
        description: lang === 'vi'
          ? `Chủ đề “${topicTitle}” vừa được thêm vào bộ “${deckTitle}”.`
          : `“${topicTitle}” was just added to “${deckTitle}”.`,
        detail: deckTitle,
        action: n.learnNow,
        iconClass: 'bg-[#e6f7ed] text-[#34845a] dark:bg-[#183328] dark:text-[#72c796]',
      }
    }

    if (notification.type === 'NEW_LEARNING_TOPIC') {
      const topicTitle = stringValue(notification.data.topicTitle, n.topicFallback)
      return {
        icon: FolderOpen,
        title: n.newLearningTopicTitle,
        description: lang === 'vi'
          ? `Một hành trình mới đang chờ bạn trong chủ đề “${topicTitle}”.`
          : `A new learning journey is waiting for you in “${topicTitle}”.`,
        detail: n.freshContent,
        action: n.viewTopic,
        iconClass: 'bg-[#e7f5f7] text-[#247e8c] dark:bg-[#183139] dark:text-[#6cc1ce]',
      }
    }

    if (notification.type === 'NEW_VIDEO_LESSON') {
      const lessonTitle = stringValue(notification.data.lessonTitle, n.lessonFallback)
      const topicTitle = stringValue(notification.data.topicTitle, n.topicFallback)
      const level = stringValue(notification.data.level)
      const premium = notification.data.premium === true
      return {
        icon: PlayCircle,
        title: n.newVideoLessonTitle,
        description: lang === 'vi'
          ? `Bài “${lessonTitle}” vừa lên sóng. Cùng luyện nghe ngay nhé!`
          : `“${lessonTitle}” is now live. Start listening and practicing!`,
        detail: [topicTitle, level, premium ? 'PRO' : ''].filter(Boolean).join(' · '),
        action: n.watchNow,
        iconClass: 'bg-[#ffebe7] text-[#c95b48] dark:bg-[#3b211d] dark:text-[#ef8a76]',
      }
    }

    const percentage = numberValue(notification.data.completionPercentage)
    const lessonTitle = stringValue(notification.data.lessonTitle, n.lessonFallback)
    return {
      icon: BookOpenText,
      title: n.continueTitle,
      description: lang === 'vi'
        ? `Bạn đã hoàn thành ${percentage}% bài “${lessonTitle}”.`
        : `You completed ${percentage}% of “${lessonTitle}”.`,
      detail: '',
      action: n.continueNow,
      iconClass: 'bg-[#eaf2ff] text-[#3f6fae] dark:bg-[#17283f] dark:text-[#78a9ea]',
    }
  })()

  const Icon = content.icon
  const relativeTime = formatDistanceToNowStrict(new Date(notification.createdAt), {
    addSuffix: true,
    locale: lang === 'vi' ? vi : enUS,
  })

  return (
    <button
      type="button"
      onClick={() => onActivate(notification)}
      className={cn(
        'group relative flex w-full items-start gap-3 text-left outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d4a853]/50',
        compact ? 'px-3.5 py-3' : 'rounded-2xl border px-4 py-4 sm:px-5',
        compact
          ? 'hover:bg-[#f4ede1] dark:hover:bg-white/[0.055]'
          : 'border-[#eadfce] bg-white hover:-translate-y-0.5 hover:border-[#d9bd85] hover:shadow-[0_10px_25px_rgba(81,59,25,0.08)] dark:border-[#373128] dark:bg-[#211f1b] dark:hover:border-[#604c2c]',
        isUnread && (compact
          ? 'bg-[#fff9ed] dark:bg-[#d4a853]/[0.07]'
          : 'border-[#e6c982] bg-[#fffbf2] dark:border-[#604c2c] dark:bg-[#d4a853]/[0.075]'),
      )}
    >
      {isUnread && (
        <span
          className={cn(
            'absolute rounded-full bg-[#d39b35] shadow-[0_0_0_3px_rgba(211,155,53,0.12)]',
            compact ? 'right-3 top-3 size-2' : 'right-4 top-4 size-2.5',
          )}
          aria-label={n.unread}
        />
      )}

      <span className={cn(
        'flex shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105',
        compact ? 'size-10' : 'size-11 sm:size-12',
        content.iconClass,
      )}>
        <Icon className={cn(compact ? 'size-[18px]' : 'size-5')} />
      </span>

      <span className="min-w-0 flex-1 pr-3">
        <span className="flex items-center gap-2">
          <span className={cn(
            'line-clamp-1 text-[#252a3e] dark:text-[#f5f1e9]',
            compact ? 'text-[13px]' : 'text-sm sm:text-[15px]',
            isUnread ? 'font-bold' : 'font-semibold',
          )}>
            {content.title}
          </span>
          {isNewContent && (
            <span className="shrink-0 rounded-full bg-gradient-to-r from-[#d59b35] to-[#e8b84b] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-white shadow-sm">
              {n.newBadge}
            </span>
          )}
        </span>
        <span className={cn(
          'mt-1 block leading-relaxed text-[#6f7483] dark:text-[#a9a397]',
          compact ? 'line-clamp-2 text-[11px]' : 'text-xs sm:text-[13px]',
        )}>
          {content.description}
        </span>
        {content.detail && (
          <span className="mt-1 block truncate text-[11px] font-medium italic text-[#9a6b18] dark:text-[#d7ab5e]">
            {content.detail}
          </span>
        )}
        <span className="mt-2 flex items-center gap-2">
          <span className="text-[10px] font-medium text-[#9b9488] dark:text-[#777166]">
            {relativeTime}
          </span>
          <span className="size-0.5 rounded-full bg-[#c8bca9]" />
          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#a26d1f] dark:text-[#e4b45f]">
            {content.action}
            <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </span>
      </span>
    </button>
  )
}
