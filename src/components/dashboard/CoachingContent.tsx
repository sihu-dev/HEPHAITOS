'use client'


import { useState, useEffect, useRef, useMemo } from 'react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DisclaimerInline } from '@/components/ui/Disclaimer'
import { AIAnalysisButton } from '@/components/widgets/AIAnalysisWidget'
import { useI18n } from '@/i18n/client'
import { useCoachingSessions, type Mentor, type LiveSession, type CoachingMessage } from '@/hooks/useCoachingSessions'
import { safeLogger } from '@/lib/utils/safe-logger';


// ============================================
// i18n Type
// ============================================

type TranslateFunction = (key: string) => string | string[] | Record<string, unknown>

// ============================================
// Icons
// ============================================

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const PlayIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
)

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg className="w-3.5 h-3.5" fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const LiveIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="8" />
  </svg>
)

const MessageIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)

const SendIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
)

const CrownIcon = () => (
  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M2.5 19h19v2h-19v-2zm19.57-9.36c-.21-.8-1.04-1.28-1.84-1.06l-3.09.81L12 2l-5.14 7.39-3.09-.81c-.8-.21-1.63.27-1.84 1.06-.21.8.27 1.63 1.06 1.84l3.94 1.04.67 4.97h9.8l.67-4.97 3.94-1.04c.8-.22 1.28-1.04 1.06-1.84z" />
  </svg>
)

const ScreenShareIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const SparklesIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
)

// ============================================
// Mentor Card Component
// ============================================

function MentorCard({
  mentor,
  onBook,
  t,
}: {
  mentor: Mentor
  onBook: () => void
  t: TranslateFunction
}) {
  return (
    <div className="p-4 rounded-lg border border-white/[0.06] hover:bg-white/[0.02] transition-colors">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center text-zinc-400">
            <UserIcon />
          </div>
          {mentor.isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-zinc-900" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white font-medium">{mentor.nameKr}</span>
            {mentor.isOnline && (
              <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 rounded">
                {t('dashboard.coaching.mentor.online') as string}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400">{mentor.title}</p>

          {/* Rating & Stats */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-yellow-400">
              <StarIcon filled />
              <span className="text-xs">{mentor.rating}</span>
            </div>
            <div className="flex items-center gap-1 text-zinc-500">
              <UsersIcon />
              <span className="text-xs">{mentor.students.toLocaleString()}</span>
            </div>
          </div>

          {/* Specialties */}
          <div className="flex flex-wrap gap-1 mt-2">
            {mentor.specialty.slice(0, 3).map((s) => (
              <span
                key={s}
                className="px-1.5 py-0.5 text-[10px] bg-white/[0.04] text-zinc-400 rounded"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Action */}
        <div className="text-right">
          <p className="text-sm text-white font-medium">
            ₩{mentor.hourlyRate.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-400 mb-2">{t('dashboard.coaching.mentor.perHour') as string}</p>
          <Button size="sm" onClick={onBook}>
            {t('dashboard.coaching.mentor.book') as string}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Live Session Card Component
// ============================================

function LiveSessionCard({
  session,
  mentor,
  onJoin,
  t,
}: {
  session: LiveSession
  mentor: Mentor | undefined
  onJoin: () => void
  t: TranslateFunction
}) {
  const isFull = session.participants >= session.maxParticipants
  const progress = (session.participants / session.maxParticipants) * 100

  return (
    <div className={clsx(
      'p-4 rounded-lg border transition-colors',
      session.isLive
        ? 'border-red-500/30 bg-red-500/5'
        : 'border-white/[0.06] hover:bg-white/[0.02]'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {session.isLive && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs">
              <LiveIcon />
              LIVE
            </div>
          )}
          {session.isPremium && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-xs">
              <CrownIcon />
              Premium
            </div>
          )}
        </div>
        <span className="text-xs text-zinc-400">
          {session.duration}{t('dashboard.coaching.session.minutes') as string}
        </span>
      </div>

      {/* Title & Description */}
      <h3 className="text-sm text-white font-medium mb-1">{session.title}</h3>
      <p className="text-xs text-zinc-400 mb-3">{session.description}</p>

      {/* Mentor */}
      {mentor && (
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center">
            <UserIcon />
          </div>
          <span className="text-xs text-zinc-400">{mentor.nameKr}</span>
        </div>
      )}

      {/* Topics */}
      <div className="flex flex-wrap gap-1 mb-3">
        {session.topics.map((topic) => (
          <span
            key={topic}
            className="px-1.5 py-0.5 text-[10px] bg-blue-500/10 text-blue-400 rounded"
          >
            #{topic}
          </span>
        ))}
      </div>

      {/* Participants Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-zinc-500">{t('dashboard.coaching.session.participants') as string}</span>
          <span className="text-zinc-400">
            {session.participants}/{session.maxParticipants}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full transition-all',
              isFull ? 'bg-red-500' : 'bg-blue-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Action */}
      <div className="flex items-center justify-between">
        {!session.isLive && (
          <div className="flex items-center gap-1 text-zinc-500">
            <ClockIcon />
            <span className="text-xs">
              {new Date(session.startTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} {t('dashboard.coaching.session.starts') as string}
            </span>
          </div>
        )}
        <Button
          size="sm"
          onClick={onJoin}
          disabled={isFull && !session.isLive}
          leftIcon={<PlayIcon />}
          className={session.isLive ? 'animate-pulse' : ''}
        >
          {session.isLive ? t('dashboard.coaching.session.join') as string : t('dashboard.coaching.session.reserve') as string}
        </Button>
      </div>
    </div>
  )
}

// ============================================
// Screen Share Panel Component (멘토 화면 동기화)
// ============================================

interface SharedChart {
  symbol: string
  name: string
  price: number
  change: number
  indicators: string[]
  mentorAnnotation?: string
}

function ScreenSharePanel({
  isActive,
  mentor,
  onClose,
  t,
}: {
  isActive: boolean
  mentor: Mentor | undefined
  onClose: () => void
  t: TranslateFunction
}) {
  const [sharedChart, setSharedChart] = useState<SharedChart>({
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 875.32,
    change: 2.45,
    indicators: ['RSI(14): 68.5', 'MACD: Bullish Cross', 'Bollinger: Near Upper Band'],
    mentorAnnotation: '',
  })

  // Simulate real-time updates
  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      setSharedChart(prev => ({
        ...prev,
        price: prev.price + (Math.random() - 0.5) * 2,
        change: prev.change + (Math.random() - 0.5) * 0.1,
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [isActive])

  if (!isActive) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-4 right-4 w-96 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-40"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-blue-400">{t('dashboard.coaching.screenShare.title') as string}</span>
          <span className="text-xs text-zinc-400">· {mentor?.nameKr}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-500 hover:text-white transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Shared Chart View */}
      <div className="p-4 space-y-3">
        {/* Chart Header */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm text-white font-medium">{sharedChart.symbol}</h4>
            <p className="text-xs text-zinc-400">{sharedChart.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white font-medium">
              ${sharedChart.price.toFixed(2)}
            </p>
            <p className={clsx(
              'text-xs',
              sharedChart.change >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}>
              {sharedChart.change >= 0 ? '+' : ''}{sharedChart.change.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Mock Chart Area */}
        <div className="h-32 bg-zinc-800/50 rounded-lg border border-zinc-700 flex items-center justify-center relative overflow-hidden">
          {/* Animated chart lines */}
          <svg className="absolute inset-0 w-full h-full opacity-30">
            <motion.path
              d="M0,80 Q50,60 100,70 T200,50 T300,65 T400,40"
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </svg>
          <div className="text-center z-10">
            <ScreenShareIcon />
            <p className="text-xs text-zinc-400 mt-1">{t('dashboard.coaching.screenShare.chartSync') as string}</p>
          </div>
        </div>

        {/* Indicators */}
        <div className="space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase tracking-wide">{t('dashboard.coaching.screenShare.indicators') as string}</p>
          <div className="flex flex-wrap gap-1">
            {sharedChart.indicators.map((indicator, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-[10px] bg-zinc-800 text-zinc-400 rounded"
              >
                {indicator}
              </span>
            ))}
          </div>
        </div>

        {/* Mentor Annotation */}
        {sharedChart.mentorAnnotation && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <SparklesIcon />
              <div>
                <p className="text-[10px] text-blue-400 font-medium mb-1">{t('dashboard.coaching.screenShare.mentorComment') as string}</p>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {sharedChart.mentorAnnotation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Button */}
        <AIAnalysisButton
          size="sm"
          trade={{
            celebrity: mentor?.nameKr || '멘토',
            ticker: sharedChart.symbol,
            company: sharedChart.name,
            action: 'buy',
            amount: '분석 중',
            date: new Date().toLocaleDateString('ko-KR'),
          }}
          className="w-full justify-center"
        />
      </div>

      {/* Disclaimer */}
      <div className="px-4 pb-3">
        <p className="text-[9px] text-zinc-400 leading-relaxed">
          ⚠️ {t('dashboard.coaching.screenShare.disclaimer') as string}
        </p>
      </div>
    </motion.div>
  )
}

// ============================================
// Live Chat Component
// ============================================

function LiveChat({
  sessionId,
  messages,
  onToggleScreenShare,
  isScreenShareActive,
  t,
}: {
  sessionId: string
  messages: CoachingMessage[]
  onToggleScreenShare: () => void
  isScreenShareActive: boolean
  t: TranslateFunction
}) {
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleSend = () => {
    if (!newMessage.trim()) return
    safeLogger.info('Send message:', { sessionId, content: newMessage })
    setNewMessage('')
  }

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MessageIcon />
            {t('dashboard.coaching.chat.title') as string}
          </CardTitle>
          <Button
            size="sm"
            variant={isScreenShareActive ? 'primary' : 'secondary'}
            onClick={onToggleScreenShare}
            className="gap-1.5"
          >
            <ScreenShareIcon />
            {isScreenShareActive ? t('dashboard.coaching.chat.syncing') as string : t('dashboard.coaching.chat.screenSync') as string}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={clsx(
                'p-3 rounded-lg',
                msg.senderId.startsWith('mentor')
                  ? 'bg-blue-500/10 border border-blue-500/20'
                  : msg.isQuestion
                  ? 'bg-yellow-500/10 border border-yellow-500/20'
                  : 'bg-white/[0.04] border border-white/[0.06]'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={clsx(
                  'text-xs font-medium',
                  msg.senderId.startsWith('mentor') ? 'text-blue-400' : 'text-zinc-300'
                )}>
                  {msg.senderName}
                </span>
                {msg.senderId.startsWith('mentor') && (
                  <span className="px-1 py-0.5 text-[9px] bg-blue-500/20 text-blue-400 rounded">
                    {t('dashboard.coaching.chat.mentorBadge') as string}
                  </span>
                )}
                {msg.isQuestion && (
                  <span className="px-1 py-0.5 text-[9px] bg-yellow-500/20 text-yellow-400 rounded">
                    {t('dashboard.coaching.chat.questionBadge') as string}
                  </span>
                )}
                <span className="text-[10px] text-zinc-400 ml-auto">
                  {new Date(msg.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-zinc-300">{msg.content}</p>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('dashboard.coaching.chat.placeholder') as string}
            className="flex-1 h-9 px-3 text-sm text-white bg-white/[0.04] border border-white/[0.06] rounded focus:outline-none focus:border-white/[0.12]"
          />
          <Button size="sm" onClick={handleSend} aria-label="Send message">
            <SendIcon />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// Main Page Component
// ============================================

export function CoachingContent() {
  const { t } = useI18n()
  const { mentors, liveSessions, messages, isLoading } = useCoachingSessions()
  const [activeSession, setActiveSession] = useState<LiveSession | null>(null)
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming'>('all')
  const [isScreenShareActive, setIsScreenShareActive] = useState(false)

  const filteredSessions = useMemo(() => {
    return liveSessions.filter((s) => {
      if (filter === 'live') return s.isLive
      if (filter === 'upcoming') return !s.isLive
      return true
    })
  }, [liveSessions, filter])

  const liveSession = useMemo(() => liveSessions.find((s) => s.isLive), [liveSessions])
  const activeMentor = activeSession
    ? mentors.find((m) => m.id === activeSession.mentorId)
    : undefined

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-base font-medium text-white">{t('dashboard.coaching.title') as string}</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          {t('dashboard.coaching.description') as string}
        </p>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Live Session Banner */}
      {liveSession && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/20 text-red-400">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-medium">LIVE NOW</span>
              </div>
              <div>
                <p className="text-sm text-white font-medium">{liveSession.title}</p>
                <p className="text-xs text-zinc-400">
                  {mentors.find((m) => m.id === liveSession.mentorId)?.nameKr} · {(t('dashboard.coaching.banner.watching') as string).replace('{count}', String(liveSession.participants))}
                </p>
              </div>
            </div>
            <Button onClick={() => setActiveSession(liveSession)} leftIcon={<PlayIcon />}>
              {t('dashboard.coaching.session.join') as string}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions & Mentors */}
        <div className="lg:col-span-2 space-y-6">
          {/* Session Filter */}
          <div className="flex items-center gap-2">
            {(['all', 'live', 'upcoming'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={clsx(
                  'px-3 py-1.5 rounded text-xs transition-colors',
                  filter === f
                    ? 'bg-white/[0.08] text-white'
                    : 'text-zinc-500 hover:text-white'
                )}
              >
                {t(`dashboard.coaching.filter.${f}`) as string}
              </button>
            ))}
          </div>

          {/* Sessions */}
          <div>
            <h2 className="text-sm text-zinc-400 font-medium mb-4">{t('dashboard.coaching.sections.upcomingSessions') as string}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSessions.map((session) => (
                <LiveSessionCard
                  key={session.id}
                  session={session}
                  mentor={mentors.find((m) => m.id === session.mentorId)}
                  onJoin={() => setActiveSession(session)}
                  t={t}
                />
              ))}
            </div>
          </div>

          {/* Mentors */}
          <div>
            <h2 className="text-sm text-zinc-400 font-medium mb-4">{t('dashboard.coaching.sections.popularMentors') as string}</h2>
            <div className="space-y-3">
              {mentors.map((mentor) => (
                <MentorCard
                  key={mentor.id}
                  mentor={mentor}
                  onBook={() => safeLogger.info('Book mentor:', mentor.id)}
                  t={t}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Live Chat */}
        <div className="lg:col-span-1">
          {activeSession ? (
            <LiveChat
              sessionId={activeSession.id}
              messages={messages}
              onToggleScreenShare={() => setIsScreenShareActive(!isScreenShareActive)}
              isScreenShareActive={isScreenShareActive}
              t={t}
            />
          ) : (
            <Card className="h-[500px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-white/[0.04] flex items-center justify-center text-zinc-400 mb-4">
                  <MessageIcon />
                </div>
                <p className="text-sm text-zinc-400">{t('dashboard.coaching.chat.empty.title') as string}</p>
                <p className="text-xs text-zinc-400 mt-1">
                  {t('dashboard.coaching.chat.empty.description') as string}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* My Learning Stats */}
      <div className="h-px bg-white/[0.06]" />

      <div>
        <h2 className="text-sm text-zinc-400 font-medium mb-4">{t('dashboard.coaching.sections.myLearning') as string}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { labelKey: 'dashboard.coaching.stats.studyHours', value: '32', unit: 'hours', icon: ClockIcon },
            { labelKey: 'dashboard.coaching.stats.sessions', value: '18', unit: 'times', icon: PlayIcon },
            { labelKey: 'dashboard.coaching.stats.questions', value: '45', unit: 'count', icon: MessageIcon },
            { labelKey: 'dashboard.coaching.stats.badges', value: '7', unit: 'count', icon: StarIcon },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg border border-white/[0.06]"
            >
              <div className="flex items-center gap-2 mb-2 text-zinc-500">
                <stat.icon filled={false} />
                <span className="text-xs">{t(stat.labelKey) as string}</span>
              </div>
              <p className="text-[20px] text-white font-medium">{stat.value}{t(`dashboard.coaching.units.${stat.unit}`) as string}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <DisclaimerInline className="mt-4" />

      {/* Screen Share Panel */}
      <AnimatePresence>
        {isScreenShareActive && activeSession && (
          <ScreenSharePanel
            isActive={isScreenShareActive}
            mentor={activeMentor}
            onClose={() => setIsScreenShareActive(false)}
            t={t}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
