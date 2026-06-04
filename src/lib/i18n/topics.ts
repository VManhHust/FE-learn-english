export const topicsI18n = {
  // Banner
  bannerBeginner: 'Dành cho người mới bắt đầu',
  bannerBeginnerDesc: 'Tập trung vào phát âm cơ bản và luyện nghe từng từ, câu đơn giản',
  bannerExpert: 'Dành cho người đã có kinh nghiệm',
  bannerExpertDesc: 'Nâng cao kỹ năng với tốc độ nói thực tế và các chủ đề phức tạp hơn',
  tagLabel: 'Luyện Shadowing và dictation qua video đa dạng chủ đề',
  lessonCount: 'bài học',
  viewAll: 'Xem tất cả',
  dictation: 'Dictation',
  shadowing: 'Shadowing',
  // Search & filters
  searchPlaceholder: 'Tìm kiếm bài học...',
  levelLabel: 'Cấp độ',
  topicLabel: 'Chủ đề',
  progressLabel: 'Tiến độ',
  selectLevel: 'Chọn cấp độ',
  selectTopic: 'Chọn chủ đề',
  selectProgress: 'Chọn tiến độ',
  clearAll: 'Xóa tất cả',
  // Level labels
  levelA1: 'A1 · Sơ cấp',
  levelA2: 'A2 · Cơ bản',
  levelB1: 'B1 · Trung cấp',
  levelB2: 'B2 · Khá',
  levelC1: 'C1 · Nâng cao',
  // Progress labels
  completed: 'Hoàn thành',
  inProgress: 'Đang làm',
  notStarted: 'Chưa làm',
  // Lesson card
  lessonCompleted: 'Hoàn thành',
  lessonInProgress: 'Đang làm',
  // Topic detail page
  backToTopics: '← Quay về chủ đề',
  totalLessons: 'Tổng số bài học:',
  searchLessons: 'Tìm kiếm bài học...',
  noLessonsFound: 'Không tìm thấy bài học nào',
  prevPage: '← Trước',
  nextPage: 'Tiếp →',
  errorTitle: 'Có lỗi xảy ra',
  backButton: 'Quay lại',
}

interface NavItem {
  label: string
  href: string
  badge?: string
}

export const sidebarI18n = {
  community: 'Cộng đồng',
  upgrade: 'Mở khóa PRO',
  student: 'Học viên',
  logout: 'Đăng xuất',
  navMain: [
    { label: 'Bài học', href: '/dashboard/topics' },
    { label: 'Từ vựng', href: '/dashboard/vocabulary' },
    { label: 'Ghi chú của tôi', href: '/dashboard/notes' },
  ] as NavItem[],
  navCommunity: [] as NavItem[],
}
