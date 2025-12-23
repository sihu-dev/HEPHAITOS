'use client'


// ============================================
// Consent Page
// GPT V1 피드백 P0-4: 만 19세 + 면책조항 동의 페이지
// ============================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { safeLogger } from '@/lib/utils/safe-logger';

interface DisclaimerVersion {
  id: string
  version: string
  title: string
  content: string
}

interface ConsentState {
  ageVerified: boolean
  disclaimerAgreed: boolean
  birthYear: string
  birthMonth: string
  birthDay: string
}

export function ConsentContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [disclaimer, setDisclaimer] = useState<DisclaimerVersion | null>(null)
  const [consent, setConsent] = useState<ConsentState>({
    ageVerified: false,
    disclaimerAgreed: false,
    birthYear: '',
    birthMonth: '',
    birthDay: '',
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 면책조항 로드
  useEffect(() => {
    async function loadDisclaimer() {
      const { data, error } = await supabase
        .from('disclaimer_versions')
        .select('id, version, title, content')
        .eq('is_active', true)
        .order('effective_date', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        safeLogger.error('Failed to load disclaimer:', error)
        return
      }

      setDisclaimer(data)
    }

    loadDisclaimer()
  }, [supabase])

  // 연령 계산
  const calculateAge = (): number | null => {
    const { birthYear, birthMonth, birthDay } = consent
    if (!birthYear || !birthMonth || !birthDay) return null

    const birth = new Date(
      parseInt(birthYear),
      parseInt(birthMonth) - 1,
      parseInt(birthDay)
    )
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    return age
  }

  const handleSubmit = async () => {
    setError(null)
    setLoading(true)

    try {
      // 사용자 확인
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login?redirect=/consent')
        return
      }

      // 연령 확인
      const age = calculateAge()
      if (age === null || age < 19) {
        setError('만 19세 이상만 서비스를 이용할 수 있습니다.')
        setLoading(false)
        return
      }

      const birthDate = `${consent.birthYear}-${consent.birthMonth.padStart(2, '0')}-${consent.birthDay.padStart(2, '0')}`

      // 연령 동의 기록
      const { error: ageError } = await supabase.rpc('record_user_consent', {
        p_user_id: user.id,
        p_consent_type: 'age_verification',
        p_agreed: true,
        p_birth_date: birthDate,
        p_metadata: { verified_age: age },
      })

      if (ageError) {
        throw new Error('연령 확인 기록에 실패했습니다.')
      }

      // 면책조항 동의 기록
      if (!consent.disclaimerAgreed) {
        setError('면책조항에 동의해주세요.')
        setLoading(false)
        return
      }

      const { error: disclaimerError } = await supabase.rpc('record_user_consent', {
        p_user_id: user.id,
        p_consent_type: 'disclaimer',
        p_agreed: true,
        p_metadata: {
          disclaimer_version: disclaimer?.version,
          disclaimer_id: disclaimer?.id,
        },
      })

      if (disclaimerError) {
        throw new Error('면책조항 동의 기록에 실패했습니다.')
      }

      // 성공 - 대시보드로 이동
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : '동의 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = (): boolean => {
    const age = calculateAge()
    return (
      consent.disclaimerAgreed &&
      age !== null &&
      age >= 19
    )
  }

  // 년도 옵션 생성 (1920 ~ 현재년도 - 19)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 19 - 1920 + 1 }, (_, i) => currentYear - 19 - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const days = Array.from({ length: 31 }, (_, i) => i + 1)

  return (
    <div className="min-h-screen bg-[#0D0D0F] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">서비스 이용 동의</h1>
          <p className="text-gray-400">
            HEPHAITOS 서비스 이용을 위해 아래 내용에 동의해주세요.
          </p>
        </div>

        {/* 카드 */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 space-y-6">
          {/* 연령 확인 */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#5E6AD2]/20 text-[#5E6AD2] text-sm flex items-center justify-center">
                1
              </span>
              연령 확인
            </h2>
            <p className="text-sm text-gray-400">
              본 서비스는 만 19세 이상만 이용 가능합니다.
            </p>

            <div className="flex gap-3">
              <select
                value={consent.birthYear}
                onChange={(e) => setConsent({ ...consent, birthYear: e.target.value })}
                className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#5E6AD2]"
              >
                <option value="">출생년도</option>
                {years.map((year) => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>

              <select
                value={consent.birthMonth}
                onChange={(e) => setConsent({ ...consent, birthMonth: e.target.value })}
                className="w-24 bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#5E6AD2]"
              >
                <option value="">월</option>
                {months.map((month) => (
                  <option key={month} value={month}>{month}월</option>
                ))}
              </select>

              <select
                value={consent.birthDay}
                onChange={(e) => setConsent({ ...consent, birthDay: e.target.value })}
                className="w-24 bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#5E6AD2]"
              >
                <option value="">일</option>
                {days.map((day) => (
                  <option key={day} value={day}>{day}일</option>
                ))}
              </select>
            </div>

            {calculateAge() !== null && (
              <p className={`text-sm ${calculateAge()! >= 19 ? 'text-green-400' : 'text-red-400'}`}>
                {calculateAge()! >= 19
                  ? `만 ${calculateAge()}세 - 이용 가능합니다.`
                  : `만 ${calculateAge()}세 - 만 19세 이상만 이용 가능합니다.`
                }
              </p>
            )}
          </div>

          {/* 구분선 */}
          <div className="border-t border-white/[0.06]" />

          {/* 면책조항 */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#5E6AD2]/20 text-[#5E6AD2] text-sm flex items-center justify-center">
                2
              </span>
              면책조항 동의
            </h2>

            {disclaimer ? (
              <>
                <div className="bg-black/30 border border-white/[0.06] rounded-lg p-4 max-h-64 overflow-y-auto">
                  <h3 className="text-white font-medium mb-3">{disclaimer.title}</h3>
                  <div className="text-sm text-gray-300 whitespace-pre-wrap prose prose-invert prose-sm">
                    {disclaimer.content.split('\n').map((line, i) => {
                      if (line.startsWith('## ')) {
                        return <h4 key={i} className="text-white font-medium mt-4 mb-2">{line.slice(3)}</h4>
                      }
                      if (line.startsWith('### ')) {
                        return <h5 key={i} className="text-white font-medium mt-3 mb-1">{line.slice(4)}</h5>
                      }
                      if (line.startsWith('- ')) {
                        return <li key={i} className="ml-4 text-gray-300">{line.slice(2)}</li>
                      }
                      if (line.match(/^\d+\./)) {
                        return <p key={i} className="text-gray-300 mt-1">{line}</p>
                      }
                      return <p key={i} className="text-gray-400">{line}</p>
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-4">버전: {disclaimer.version}</p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={consent.disclaimerAgreed}
                    onChange={(e) => setConsent({ ...consent, disclaimerAgreed: e.target.checked })}
                    className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-[#5E6AD2] focus:ring-[#5E6AD2] focus:ring-offset-0"
                  />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    위 면책조항의 내용을 모두 읽고 이해했으며, 이에 동의합니다.
                    투자 결정은 본인의 판단과 책임 하에 이루어짐을 확인합니다.
                  </span>
                </label>
              </>
            ) : (
              <div className="text-gray-400 text-center py-8">
                면책조항을 불러오는 중...
              </div>
            )}
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* 제출 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={!isFormValid() || loading}
            className={`w-full py-4 rounded-xl font-medium text-white transition-all ${
              isFormValid() && !loading
                ? 'bg-[#5E6AD2] hover:bg-[#6B78E5] cursor-pointer'
                : 'bg-gray-700 cursor-not-allowed opacity-50'
            }`}
          >
            {loading ? '처리 중...' : '동의하고 계속하기'}
          </button>

          <p className="text-xs text-gray-500 text-center">
            동의 정보는 법적 요구사항 준수를 위해 안전하게 저장됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}
