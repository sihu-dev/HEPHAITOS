'use client'

// ============================================
// Beta Invite Code Input Component
// Loop 9: 초대코드 입력 UI
// ============================================

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface InviteCodeInputProps {
  userId: string
  onSuccess?: (credits: number) => void
  onError?: (error: string) => void
}

export function InviteCodeInput({ userId, onSuccess, onError }: InviteCodeInputProps) {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{
    type: 'idle' | 'validating' | 'success' | 'error'
    message?: string
    credits?: number
  }>({ type: 'idle' })

  // 코드 포맷팅 (자동 대시 삽입)
  const formatCode = (value: string): string => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (cleaned.length <= 5) return cleaned
    if (cleaned.length <= 9) return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 9)}-${cleaned.slice(9, 13)}`
  }

  // 코드 유효성 검증 (미리보기)
  const validateCode = async (codeToValidate: string) => {
    if (codeToValidate.length < 10) return

    setStatus({ type: 'validating' })

    try {
      const response = await fetch(`/api/beta/invite?code=${encodeURIComponent(codeToValidate)}`)
      const data = await response.json()

      if (data.valid) {
        setStatus({
          type: 'idle',
          message: data.message,
          credits: data.bonus_credits,
        })
      } else {
        setStatus({
          type: 'error',
          message: data.message,
        })
      }
    } catch {
      setStatus({ type: 'idle' })
    }
  }

  // 코드 사용
  const handleSubmit = async () => {
    if (!code.trim()) return

    setIsLoading(true)
    setStatus({ type: 'validating' })

    try {
      const response = await fetch('/api/beta/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.replace(/-/g, ''), userId }),
      })

      const data = await response.json()

      if (data.success) {
        setStatus({
          type: 'success',
          message: data.message,
          credits: data.credits_granted,
        })
        setCode('')
        onSuccess?.(data.credits_granted)
      } else {
        setStatus({
          type: 'error',
          message: data.message || '초대코드 사용에 실패했습니다.',
        })
        onError?.(data.error)
      }
    } catch {
      setStatus({
        type: 'error',
        message: '네트워크 오류가 발생했습니다.',
      })
      onError?.('NETWORK_ERROR')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="HEPHA-XXXX-XXXX"
          value={code}
          onChange={(e) => {
            const formatted = formatCode(e.target.value)
            setCode(formatted)
            if (formatted.length >= 10) {
              validateCode(formatted)
            }
          }}
          maxLength={16}
          className="font-mono tracking-wider"
          disabled={isLoading || status.type === 'success'}
        />
        <Button
          onClick={handleSubmit}
          disabled={isLoading || code.length < 10 || status.type === 'success'}
          variant="primary"
        >
          {isLoading ? '확인 중...' : '적용'}
        </Button>
      </div>

      {/* 상태 메시지 */}
      {status.message && (
        <div
          className={`text-sm p-3 rounded-lg ${
            status.type === 'success'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : status.type === 'error'
              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
          }`}
        >
          {status.type === 'success' && '✅ '}
          {status.type === 'error' && '❌ '}
          {status.message}
          {status.credits && status.type !== 'error' && (
            <span className="ml-2 font-semibold">+{status.credits} 크레딧</span>
          )}
        </div>
      )}

      {/* 안내 문구 */}
      <p className="text-xs text-gray-500">
        베타 초대코드가 있으시면 입력해주세요. 보너스 크레딧이 지급됩니다.
      </p>
    </div>
  )
}

export default InviteCodeInput
