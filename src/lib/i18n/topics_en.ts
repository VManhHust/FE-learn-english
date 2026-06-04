export const topicsI18n_en = {
  // Banner
  bannerBeginner: 'For beginners',
  bannerBeginnerDesc: 'Focus on basic pronunciation and listening to individual words and simple sentences',
  bannerExpert: 'For experienced learners',
  bannerExpertDesc: 'Level up with real native speaking speed and more complex topics',
  tagLabel: 'Practice Shadowing and Dictation with diverse topic videos',
  lessonCount: 'lessons',
  viewAll: 'View all',
  dictation: 'Dictation',
  shadowing: 'Shadowing',
  // Search & filters
  searchPlaceholder: 'Search lessons...',
  levelLabel: 'Level',
  topicLabel: 'Topic',
  progressLabel: 'Progress',
  selectLevel: 'Select level',
  selectTopic: 'Select topic',
  selectProgress: 'Select progress',
  clearAll: 'Clear all',
  // Level labels
  levelA1: 'A1 · Beginner',
  levelA2: 'A2 · Elementary',
  levelB1: 'B1 · Intermediate',
  levelB2: 'B2 · Upper Intermediate',
  levelC1: 'C1 · Advanced',
  // Progress labels
  completed: 'Completed',
  inProgress: 'In Progress',
  notStarted: 'Not Started',
  // Lesson card
  lessonCompleted: 'Completed',
  lessonInProgress: 'In Progress',
  // Topic detail page
  backToTopics: '← Back to topics',
  totalLessons: 'Total lessons:',
  searchLessons: 'Search lessons...',
  noLessonsFound: 'No lessons found',
  prevPage: '← Prev',
  nextPage: 'Next →',
  errorTitle: 'An error occurred',
  backButton: 'Go back',
}

interface NavItem {
  label: string
  href: string
  badge?: string
}

export const sidebarI18n_en = {
  community: 'Community',
  upgrade: 'Unlock PRO',
  student: 'Student',
  logout: 'Log out',
  navMain: [
    { label: 'Lessons', href: '/dashboard/topics' },
    { label: 'Vocabulary', href: '/dashboard/vocabulary' },
    { label: 'My Notes', href: '/dashboard/notes' },
  ] as NavItem[],
  navCommunity: [] as NavItem[],
}
