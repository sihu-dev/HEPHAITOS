'use client'

// ============================================
// Mentor Coaching Component
// Loop 21: 멘토 코칭 정식 런칭
// ============================================

import { useCallback, useState, useEffect } from 'react'
import Image from 'next/image'
import {
  User,
  Star,
  Clock,
  Calendar,
  Video,
  MessageSquare,
  Award,
  CheckCircle2,
  ChevronRight,
  Search,
  Filter,
  Play,
  Users,
  DollarSign,
  TrendingUp,
  Brain,
  Shield,
  Layers,
  Activity,
  FileText,
  Cpu,
  BarChart,
  AlertTriangle,
} from 'lucide-react'

// ============================================
// Types
// ============================================

interface Mentor {
  user_id: string
  display_name: string
  title: string
  bio: string | null
  avatar_url: string | null
  specialties: string[]
  experience_years: number | null
  hourly_rate_credits: number
  session_duration: number
  total_sessions: number
  total_students: number
  rating_avg: number | null
  rating_count: number
  is_featured: boolean
  verification_status: string
}

interface Availability {
  id: string
  slot_date: string
  slot_start: string
  slot_end: string
  status: string
}

interface Session {
  id: string
  mentor_id: string
  student_id: string
  scheduled_date: string
  scheduled_start: string
  scheduled_end: string
  session_type: string
  topic: string | null
  status: string
  meeting_url: string | null
  credits_paid: number
  mentor?: {
    display_name: string
    title: string
    avatar_url: string | null
  }
}

// ============================================
// Specialty Config
// ============================================

const SPECIALTY_ICONS: Record<string, React.ReactNode> = {
  stocks: <TrendingUp className="w-4 h-4" />,
  options: <Layers className="w-4 h-4" />,
  crypto: <DollarSign className="w-4 h-4" />,
  forex: <DollarSign className="w-4 h-4" />,
  futures: <BarChart className="w-4 h-4" />,
  quant: <Cpu className="w-4 h-4" />,
  technical: <Activity className="w-4 h-4" />,
  fundamental: <FileText className="w-4 h-4" />,
  risk: <Shield className="w-4 h-4" />,
  psychology: <Brain className="w-4 h-4" />,
}

const SPECIALTY_LABELS: Record<string, string> = {
  stocks: '주식',
  options: '옵션',
  crypto: '암호화폐',
  forex: '외환',
  futures: '선물',
  quant: '퀀트',
  technical: '기술적 분석',
  fundamental: '펀더멘털 분석',
  risk: '리스크 관리',
  psychology: '트레이딩 심리',
}

// ============================================
// Main Component
// ============================================

export default function MentorCoaching() {
  const [activeTab, setActiveTab] = useState<'browse' | 'my_sessions' | 'become_mentor'>('browse')
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null)
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const url = selectedSpecialty
        ? `/api/coaching?type=mentors&specialty=${selectedSpecialty}`
        : '/api/coaching?type=mentors'

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setMentors(data.mentors || [])
      }
    } catch (error) {
      console.error('Failed to load mentors:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedSpecialty])

  useEffect(() => {
    loadData()
  }, [loadData])

  const loadMySessions = async () => {
    try {
      // TODO: 실제 userId 사용
      const response = await fetch('/api/coaching?type=my_sessions&userId=current-user')
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
  }

  useEffect(() => {
    if (activeTab === 'my_sessions') {
      loadMySessions()
    }
  }, [activeTab])

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">1:1 멘토 코칭</h1>
          <p className="text-gray-400">
            검증된 전문 트레이더에게 직접 배우세요. 실시간 화면 공유와 맞춤형 조언을 받을 수 있습니다.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/10">
          <TabButton active={activeTab === 'browse'} onClick={() => setActiveTab('browse')}>
            멘토 찾기
          </TabButton>
          <TabButton active={activeTab === 'my_sessions'} onClick={() => setActiveTab('my_sessions')}>
            내 세션
          </TabButton>
          <TabButton active={activeTab === 'become_mentor'} onClick={() => setActiveTab('become_mentor')}>
            멘토 되기
          </TabButton>
        </div>

        {/* Browse Mentors */}
        {activeTab === 'browse' && (
          <div className="flex gap-6">
            {/* Filters Sidebar */}
            <div className="w-64 shrink-0">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">전문 분야</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedSpecialty(null)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    !selectedSpecialty
                      ? 'bg-[#5E6AD2] text-white'
                      : 'text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>전체</span>
                </button>
                {Object.entries(SPECIALTY_LABELS).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setSelectedSpecialty(id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      selectedSpecialty === id
                        ? 'bg-[#5E6AD2] text-white'
                        : 'text-gray-400 hover:bg-white/5'
                    }`}
                  >
                    {SPECIALTY_ICONS[id]}
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mentors Grid */}
            <div className="flex-1">
              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="멘토 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#5E6AD2]"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5E6AD2]" />
                </div>
              ) : mentors.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>등록된 멘토가 없습니다</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {mentors
                    .filter((m) =>
                      !searchQuery ||
                      m.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      m.title.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((mentor) => (
                      <MentorCard
                        key={mentor.user_id}
                        mentor={mentor}
                        onClick={() => setSelectedMentor(mentor)}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Sessions */}
        {activeTab === 'my_sessions' && (
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>예약된 세션이 없습니다</p>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="mt-4 px-4 py-2 bg-[#5E6AD2] text-white rounded-lg hover:bg-[#4E5AC2] transition-colors"
                >
                  멘토 찾아보기
                </button>
              </div>
            ) : (
              sessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))
            )}
          </div>
        )}

        {/* Become Mentor */}
        {activeTab === 'become_mentor' && <BecomeMentorSection />}

        {/* Mentor Detail Modal */}
        {selectedMentor && (
          <MentorDetailModal
            mentor={selectedMentor}
            onClose={() => setSelectedMentor(null)}
          />
        )}

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-200/80">
              <p className="font-semibold mb-1">면책조항</p>
              <p>
                멘토링 세션은 교육 및 정보 제공 목적입니다.
                멘토의 의견은 투자 조언이 아니며, 모든 투자 결정에 대한 책임은 본인에게 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Sub Components
// ============================================

function TabButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 border-b-2 transition-colors ${
        active
          ? 'border-[#5E6AD2] text-white'
          : 'border-transparent text-gray-400 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function MentorCard({
  mentor,
  onClick,
}: {
  mentor: Mentor
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-[#5E6AD2]/50 cursor-pointer transition-all"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5E6AD2] to-purple-500 flex items-center justify-center overflow-hidden">
          {mentor.avatar_url ? (
            <Image src={mentor.avatar_url} alt={`${mentor.display_name} 프로필 이미지`} width={48} height={48} className="w-full h-full object-cover" />
          ) : (
            <User className="w-6 h-6" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{mentor.display_name}</span>
            {mentor.verification_status === 'verified' && (
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
            )}
            {mentor.is_featured && (
              <span className="px-2 py-0.5 bg-[#5E6AD2] text-xs rounded-full">추천</span>
            )}
          </div>
          <p className="text-sm text-gray-400">{mentor.title}</p>
        </div>
      </div>

      {/* Specialties */}
      <div className="flex flex-wrap gap-1 mb-3">
        {mentor.specialties.slice(0, 3).map((spec) => (
          <span key={spec} className="px-2 py-0.5 bg-white/10 text-xs rounded flex items-center gap-1">
            {SPECIALTY_ICONS[spec]}
            {SPECIALTY_LABELS[spec] || spec}
          </span>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-center text-sm">
        <div>
          <div className="text-gray-400">세션</div>
          <div className="font-semibold">{mentor.total_sessions}</div>
        </div>
        <div>
          <div className="text-gray-400">수강생</div>
          <div className="font-semibold">{mentor.total_students}</div>
        </div>
        <div>
          <div className="text-gray-400">평점</div>
          <div className="font-semibold flex items-center justify-center gap-1">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            {mentor.rating_avg?.toFixed(1) || '-'}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock className="w-4 h-4" />
          <span>{mentor.session_duration}분</span>
        </div>
        <div className="font-semibold text-[#5E6AD2]">
          {mentor.hourly_rate_credits} 크레딧
        </div>
      </div>
    </div>
  )
}

function SessionCard({ session }: { session: Session }) {
  const statusColors: Record<string, string> = {
    scheduled: 'text-blue-400',
    confirmed: 'text-green-400',
    in_progress: 'text-yellow-400',
    completed: 'text-gray-400',
    cancelled: 'text-red-400',
  }

  const statusLabels: Record<string, string> = {
    scheduled: '예정',
    confirmed: '확정',
    in_progress: '진행 중',
    completed: '완료',
    cancelled: '취소됨',
  }

  return (
    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5E6AD2] to-purple-500 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold">{session.mentor?.display_name || '멘토'}</div>
            <div className="text-sm text-gray-400">{session.mentor?.title}</div>
          </div>
        </div>
        <span className={`text-sm ${statusColors[session.status] || 'text-gray-400'}`}>
          {statusLabels[session.status] || session.status}
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{session.scheduled_date}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{session.scheduled_start} - {session.scheduled_end}</span>
        </div>
      </div>

      {session.topic && (
        <p className="text-sm text-gray-300 mb-3">{session.topic}</p>
      )}

      {session.status === 'confirmed' && session.meeting_url && (
        <button className="w-full py-2 bg-[#5E6AD2] text-white rounded-lg hover:bg-[#4E5AC2] transition-colors flex items-center justify-center gap-2">
          <Video className="w-4 h-4" />
          세션 참가하기
        </button>
      )}

      {session.status === 'completed' && (
        <button className="w-full py-2 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
          <Star className="w-4 h-4" />
          리뷰 작성하기
        </button>
      )}
    </div>
  )
}

function MentorDetailModal({
  mentor,
  onClose,
}: {
  mentor: Mentor
  onClose: () => void
}) {
  const [availability, setAvailability] = useState<Record<string, Availability[]>>({})
  const [selectedSlot, setSelectedSlot] = useState<Availability | null>(null)
  const [booking, setBooking] = useState(false)
  const [topic, setTopic] = useState('')

  const loadAvailability = useCallback(async () => {
    try {
      const response = await fetch(`/api/coaching?type=availability&mentorId=${mentor.user_id}`)
      if (response.ok) {
        const data = await response.json()
        setAvailability(data.slots || {})
      }
    } catch (error) {
      console.error('Failed to load availability:', error)
    }
  }, [mentor.user_id])

  useEffect(() => {
    loadAvailability()
  }, [loadAvailability])

  const handleBook = async () => {
    if (!selectedSlot) return

    setBooking(true)
    try {
      const response = await fetch('/api/coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'book_session',
          mentorId: mentor.user_id,
          availabilityId: selectedSlot.id,
          topic,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('세션이 예약되었습니다!')
        onClose()
      } else {
        alert(data.error || '예약에 실패했습니다')
      }
    } catch (error) {
      alert('예약 처리 중 오류가 발생했습니다')
    } finally {
      setBooking(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A1F] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#5E6AD2] to-purple-500 flex items-center justify-center overflow-hidden">
              {mentor.avatar_url ? (
                <Image src={mentor.avatar_url} alt={`${mentor.display_name} 프로필 이미지`} width={64} height={64} className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">{mentor.display_name}</h2>
                {mentor.verification_status === 'verified' && (
                  <CheckCircle2 className="w-5 h-5 text-blue-400" />
                )}
              </div>
              <p className="text-gray-400">{mentor.title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Bio */}
          {mentor.bio && (
            <div>
              <h3 className="font-semibold mb-2">소개</h3>
              <p className="text-gray-400">{mentor.bio}</p>
            </div>
          )}

          {/* Specialties */}
          <div>
            <h3 className="font-semibold mb-2">전문 분야</h3>
            <div className="flex flex-wrap gap-2">
              {mentor.specialties.map((spec) => (
                <span key={spec} className="px-3 py-1 bg-white/10 rounded-full text-sm flex items-center gap-1">
                  {SPECIALTY_ICONS[spec]}
                  {SPECIALTY_LABELS[spec] || spec}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-3 bg-white/5 rounded-lg text-center">
              <div className="text-xs text-gray-400 mb-1">경력</div>
              <div className="font-semibold">{mentor.experience_years || '-'}년</div>
            </div>
            <div className="p-3 bg-white/5 rounded-lg text-center">
              <div className="text-xs text-gray-400 mb-1">세션</div>
              <div className="font-semibold">{mentor.total_sessions}</div>
            </div>
            <div className="p-3 bg-white/5 rounded-lg text-center">
              <div className="text-xs text-gray-400 mb-1">수강생</div>
              <div className="font-semibold">{mentor.total_students}</div>
            </div>
            <div className="p-3 bg-white/5 rounded-lg text-center">
              <div className="text-xs text-gray-400 mb-1">평점</div>
              <div className="font-semibold flex items-center justify-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                {mentor.rating_avg?.toFixed(1) || '-'}
              </div>
            </div>
          </div>

          {/* Availability */}
          <div>
            <h3 className="font-semibold mb-3">예약 가능 시간</h3>
            {Object.keys(availability).length === 0 ? (
              <p className="text-gray-400 text-sm">현재 예약 가능한 시간이 없습니다</p>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {Object.entries(availability).map(([date, slots]) => (
                  <div key={date}>
                    <div className="text-sm text-gray-400 mb-2">{date}</div>
                    <div className="flex flex-wrap gap-2">
                      {slots.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                            selectedSlot?.id === slot.id
                              ? 'bg-[#5E6AD2] text-white'
                              : 'bg-white/10 hover:bg-white/20'
                          }`}
                        >
                          {slot.slot_start}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Topic */}
          {selectedSlot && (
            <div>
              <h3 className="font-semibold mb-2">세션 주제 (선택)</h3>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="멘토에게 질문하고 싶은 내용이나 배우고 싶은 주제를 입력하세요..."
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#5E6AD2] resize-none h-24"
              />
            </div>
          )}

          {/* Booking */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div>
              <div className="text-sm text-gray-400">세션 비용</div>
              <div className="text-xl font-bold text-[#5E6AD2]">
                {mentor.hourly_rate_credits} 크레딧
                <span className="text-sm text-gray-400 ml-2">/ {mentor.session_duration}분</span>
              </div>
            </div>
            <button
              onClick={handleBook}
              disabled={!selectedSlot || booking}
              className="px-6 py-3 bg-[#5E6AD2] text-white rounded-lg hover:bg-[#4E5AC2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              {booking ? '예약 중...' : '세션 예약하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function BecomeMentorSection() {
  const [formData, setFormData] = useState({
    displayName: '',
    title: '',
    bio: '',
    specialties: [] as string[],
    experienceYears: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!formData.displayName || !formData.title) {
      alert('이름과 직함은 필수입니다')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply_mentor',
          ...formData,
          experienceYears: formData.experienceYears ? parseInt(formData.experienceYears) : null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('멘토 신청이 완료되었습니다. 검토 후 연락드리겠습니다.')
      } else {
        alert(data.error || '신청에 실패했습니다')
      }
    } catch (error) {
      alert('신청 처리 중 오류가 발생했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="p-6 bg-white/5 rounded-xl border border-white/10">
        <div className="text-center mb-6">
          <Award className="w-12 h-12 mx-auto text-[#5E6AD2] mb-3" />
          <h2 className="text-xl font-bold mb-2">HEPHAITOS 멘토가 되세요</h2>
          <p className="text-gray-400">
            전문 지식을 공유하고 수익을 창출하세요. 80%의 수익 분배를 제공합니다.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">이름 *</label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="멘토로 표시될 이름"
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#5E6AD2]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">직함 / 타이틀 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="예: 전업 트레이더 10년차, 전 증권사 애널리스트"
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#5E6AD2]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">소개</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="본인을 소개해주세요..."
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#5E6AD2] resize-none h-24"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">전문 분야</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SPECIALTY_LABELS).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => {
                    const specs = formData.specialties.includes(id)
                      ? formData.specialties.filter((s) => s !== id)
                      : [...formData.specialties, id]
                    setFormData({ ...formData, specialties: specs })
                  }}
                  className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-colors ${
                    formData.specialties.includes(id)
                      ? 'bg-[#5E6AD2] text-white'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {SPECIALTY_ICONS[id]}
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">경력 (년)</label>
            <input
              type="number"
              value={formData.experienceYears}
              onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
              placeholder="투자/트레이딩 경력"
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#5E6AD2]"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 bg-[#5E6AD2] text-white rounded-lg hover:bg-[#4E5AC2] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? '제출 중...' : '멘토 신청하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
