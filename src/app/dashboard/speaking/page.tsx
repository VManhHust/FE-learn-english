'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopicsHeader from '@/components/layout/TopicsHeader'
import Sidebar from '@/components/layout/Sidebar'
import { axiosInstance } from '@/lib/auth/authClient'

type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

interface UserStats {
  sessionCount: number
  talkMinutes: number
  likes: number
  displayName: string
}

interface SpeakingApiResponse {
  userStats: UserStats
  onlineCount: number
}

interface Room {
  id: number
  roomName: string
  currentMembers: number
  maxMembers: number
  isPublic: boolean
}

const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const TOPICS = [
  'IELTS Speaking', 'TOEIC Speaking', 'TOEFL', 'Business English',
  'Academic English', 'Daily Conversation', 'Travel', 'Food',
  'Music', 'Sport', 'Tech', 'Movies', 'Books', 'Science',
  'Art', 'Gaming', 'Business', 'Health', 'Fashion', 'Nature',
]

const DEFAULT_STATS: UserStats = { sessionCount: 0, talkMinutes: 0, likes: 0, displayName: '' }

function formatMinutes(m: number): string {
  return m + 'm'
}

export default function SpeakingPage() {
  const router = useRouter()

  const [selectedLevel, setSelectedLevel] = useState<Level>('A1')
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set())
  const [userStats, setUserStats] = useState<UserStats>(DEFAULT_STATS)
  const [onlineCount, setOnlineCount] = useState(0)
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [roomsLoading, setRoomsLoading] = useState(true)
  const [roomsError, setRoomsError] = useState<string | null>(null)

  // Create room form state
  const [roomName, setRoomName] = useState('English Practice Room')
  const [maxMembers, setMaxMembers] = useState<2 | 3 | 4 | 5>(2)
  const [isPublic, setIsPublic] = useState(true)
  const [roomFormError, setRoomFormError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const fetchRooms = () => {
    setRoomsLoading(true)
    setRoomsError(null)
    axiosInstance.get<Room[]>('/api/speaking/rooms')
      .then((res) => setRooms(res.data))
      .catch(() => setRoomsError('Không thể tải danh sách phòng.'))
      .finally(() => setRoomsLoading(false))
  }

  useEffect(() => {
    axiosInstance.get<SpeakingApiResponse>('/api/speaking')
      .then((res) => {
        setUserStats(res.data.userStats)
        setOnlineCount(res.data.onlineCount)
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push('/login')
        } else {
          setError('Không thể tải dữ liệu. Vui lòng thử lại.')
          setUserStats(DEFAULT_STATS)
        }
      })
      .finally(() => setLoading(false))

    fetchRooms()
  }, [router])

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) => {
      const next = new Set(prev)
      if (next.has(topic)) next.delete(topic)
      else next.add(topic)
      return next
    })
  }

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      setRoomFormError('Tên phòng không được để trống.')
      return
    }
    setRoomFormError(null)
    setCreating(true)
    try {
      await axiosInstance.post('/api/speaking/rooms', {
        roomName: roomName.trim(),
        maxMembers,
        isPublic,
      })
      fetchRooms()
    } catch (err: unknown) {
      const e = err as { response?: { status?: number } }
      if (e.response?.status === 401) {
        router.push('/login')
      } else {
        setRoomFormError('Không thể tạo phòng. Vui lòng thử lại.')
      }
    } finally {
      setCreating(false)
    }
  }

  const avatarLetter = userStats.displayName ? userStats.displayName.charAt(0).toUpperCase() : '?'

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-cream)' }}>
      <TopicsHeader />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-w-0 px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ===== LEFT COLUMN ===== */}
            <div className="space-y-5">

              {/* Title */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: '#f3e8ff' }}>🎤</div>
                <div>
                  <h1 className="text-xl font-bold" style={{ color: '#1a1a2e' }}>Luyện Nói Tiếng Anh Online</h1>
                  <p className="text-sm" style={{ color: '#6b7280' }}>Kết nối với người thật, luyện nói mỗi ngày</p>
                </div>
              </div>

              {error && (
                <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                  {error}
                </div>
              )}

              {/* Level Selector */}
              <div className="rounded-2xl bg-white p-5 space-y-3" style={{ border: '1px solid #e5e7eb' }}>
                <p className="text-sm font-semibold" style={{ color: '#374151' }}>Trình độ của bạn</p>
                <div className="flex gap-2 flex-wrap">
                  {LEVELS.map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setSelectedLevel(lvl)}
                      className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                      style={{
                        background: selectedLevel === lvl ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : '#f3f4f6',
                        color: selectedLevel === lvl ? '#fff' : '#374151',
                        boxShadow: selectedLevel === lvl ? '0 2px 8px rgba(124,58,237,0.35)' : 'none',
                      }}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Chips */}
              <div className="rounded-2xl bg-white p-5 space-y-3" style={{ border: '1px solid #e5e7eb' }}>
                <p className="text-sm font-semibold" style={{ color: '#374151' }}>
                  Chủ đề quan tâm{' '}
                  <span className="font-normal" style={{ color: '#9ca3af' }}>(không bắt buộc)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map((topic) => {
                    const active = selectedTopics.has(topic)
                    return (
                      <button
                        key={topic}
                        onClick={() => toggleTopic(topic)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                        style={{
                          background: active ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : '#f3f4f6',
                          color: active ? '#fff' : '#374151',
                          boxShadow: active ? '0 2px 6px rgba(124,58,237,0.3)' : 'none',
                        }}
                      >
                        {topic}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Start Call Button + Online Count */}
              <div className="space-y-2">
                <button
                  className="w-full py-4 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)', letterSpacing: '0.02em' }}
                >
                  🎤 Bắt đầu gọi
                </button>
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm" style={{ color: '#6b7280' }}>
                    <span className="font-semibold" style={{ color: '#7c3aed' }}>{onlineCount}</span> đang trò chuyện
                  </span>
                  <button className="text-sm font-medium" style={{ color: '#7c3aed' }}>
                    Quy tắc cộng đồng
                  </button>
                </div>
              </div>

              {/* User Stats Card */}
              {loading ? (
                <div className="rounded-2xl p-5 animate-pulse bg-white" style={{ border: '1px solid #e5e7eb' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full" style={{ backgroundColor: '#e5e7eb' }} />
                    <div className="h-4 w-32 rounded" style={{ backgroundColor: '#e5e7eb' }} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 rounded-xl" style={{ backgroundColor: '#e5e7eb' }} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-white p-5 space-y-4" style={{ border: '1px solid #e5e7eb' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
                      {avatarLetter}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>{userStats.displayName || 'Người dùng'}</p>
                      <p className="text-xs" style={{ color: '#9ca3af' }}>Thống kê của bạn</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl p-3 text-center" style={{ backgroundColor: '#f3e8ff' }}>
                      <p className="text-xl font-bold" style={{ color: '#7c3aed' }}>{userStats.sessionCount}</p>
                      <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Phiên gọi</p>
                    </div>
                    <div className="rounded-xl p-3 text-center" style={{ backgroundColor: '#fdf2f8' }}>
                      <p className="text-xl font-bold" style={{ color: '#ec4899' }}>{formatMinutes(userStats.talkMinutes)}</p>
                      <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Thời gian nói</p>
                    </div>
                    <div className="rounded-xl p-3 text-center" style={{ backgroundColor: '#fff7ed' }}>
                      <p className="text-xl font-bold" style={{ color: '#f59e0b' }}>{userStats.likes}</p>
                      <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Lượt thích</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ===== RIGHT COLUMN ===== */}
            <div className="space-y-5">

              {/* Create Room Card */}
              <div className="rounded-2xl bg-white p-5 space-y-4" style={{ border: '1px solid #e5e7eb' }}>
                <h2 className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>Tạo phòng</h2>

                {roomFormError && (
                  <div className="rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                    {roomFormError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: '#374151' }}>Tên phòng</label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ border: '1px solid #e5e7eb', color: '#1a1a2e' }}
                    placeholder="Nhập tên phòng..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: '#374151' }}>Số thành viên tối đa</label>
                  <div className="flex gap-2">
                    {([2, 3, 4, 5] as const).map((n) => (
                      <button
                        key={n}
                        onClick={() => setMaxMembers(n)}
                        className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                        style={{
                          background: maxMembers === n ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : '#f3f4f6',
                          color: maxMembers === n ? '#fff' : '#374151',
                          boxShadow: maxMembers === n ? '0 2px 8px rgba(124,58,237,0.35)' : 'none',
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: '#374151' }}>Chế độ phòng</span>
                  <div className="flex rounded-xl overflow-hidden" style={{ border: '1.5px solid #e5e7eb' }}>
                    <button
                      onClick={() => setIsPublic(true)}
                      className="px-4 py-2 text-xs font-semibold transition-all"
                      style={{
                        background: isPublic ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : '#fff',
                        color: isPublic ? '#fff' : '#374151',
                      }}
                    >
                      🌐 Công khai
                    </button>
                    <button
                      onClick={() => setIsPublic(false)}
                      className="px-4 py-2 text-xs font-semibold transition-all"
                      style={{
                        background: !isPublic ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : '#fff',
                        color: !isPublic ? '#fff' : '#374151',
                      }}
                    >
                      🔒 Riêng tư
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleCreateRoom}
                  disabled={creating}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white shadow-md hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)', opacity: creating ? 0.7 : 1 }}
                >
                  {creating ? 'Đang tạo...' : '✨ Tạo phòng'}
                </button>
              </div>

              {/* Room List Card */}
              <div className="rounded-2xl bg-white p-5 space-y-4" style={{ border: '1px solid #e5e7eb' }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>Phòng hiện có</h2>
                  <button
                    onClick={fetchRooms}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:bg-gray-200"
                    style={{ backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }}
                  >
                    🔄 Làm mới
                  </button>
                </div>

                {roomsError && (
                  <div className="rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                    {roomsError}
                  </div>
                )}

                {roomsLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-14 rounded-xl animate-pulse" style={{ backgroundColor: '#f3f4f6' }} />
                    ))}
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="py-10 flex flex-col items-center gap-2">
                    <span className="text-3xl">🏠</span>
                    <p className="text-sm" style={{ color: '#9ca3af' }}>Chưa có phòng nào. Hãy tạo một phòng!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rooms.map((room) => (
                      <div
                        key={room.id}
                        className="flex items-center justify-between px-4 py-3 rounded-xl"
                        style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: '#1a1a2e' }}>{room.roomName}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                            {room.currentMembers}/{room.maxMembers} thành viên
                          </p>
                        </div>
                        <span
                          className="ml-3 shrink-0 px-2 py-1 rounded-lg text-xs font-medium"
                          style={{
                            backgroundColor: room.isPublic ? '#dcfce7' : '#fef3c7',
                            color: room.isPublic ? '#16a34a' : '#d97706',
                          }}
                        >
                          {room.isPublic ? 'Công khai' : 'Riêng tư'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
