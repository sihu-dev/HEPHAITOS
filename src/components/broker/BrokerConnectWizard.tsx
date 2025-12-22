'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import { CheckIcon, ArrowLeftIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SUPPORTED_BROKERS, type BrokerId, type BrokerInfo } from '@/lib/broker'
import { BrokerStatusBadge } from './BrokerStatusBadge'

// ============================================
// Types
// ============================================

interface BrokerConnectWizardProps {
  onConnect?: (brokerId: BrokerId, credentials: BrokerCredentials) => Promise<void>
  onCancel?: () => void
  defaultBroker?: BrokerId
}

interface BrokerCredentials {
  apiKey: string
  apiSecret: string
  accountNumber?: string
  accountType?: 'real' | 'paper'
}

type WizardStep = 'select' | 'credentials' | 'connecting' | 'success' | 'error'

// ============================================
// Broker Select Step
// ============================================

function BrokerSelectStep({
  brokers,
  selectedBroker,
  onSelect,
  onNext,
}: {
  brokers: BrokerInfo[]
  selectedBroker: BrokerId | null
  onSelect: (id: BrokerId) => void
  onNext: () => void
}) {
  const groupedBrokers = {
    kr_stock: brokers.filter(b => b.markets.includes('kr_stock')),
    us_stock: brokers.filter(b => b.markets.includes('us_stock')),
    crypto: brokers.filter(b => b.markets.includes('crypto')),
  }

  return (
    <div className="space-y-6">
      {/* Korean Stock Brokers */}
      {groupedBrokers.kr_stock.length > 0 && (
        <div>
          <h3 className="text-xs text-zinc-400 uppercase tracking-wider mb-3">
            한국 주식
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {groupedBrokers.kr_stock.map(broker => (
              <BrokerCard
                key={broker.id}
                broker={broker}
                selected={selectedBroker === broker.id}
                onClick={() => onSelect(broker.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* US Stock Brokers */}
      {groupedBrokers.us_stock.length > 0 && (
        <div>
          <h3 className="text-xs text-zinc-400 uppercase tracking-wider mb-3">
            미국 주식
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {groupedBrokers.us_stock
              .filter(b => !b.markets.includes('kr_stock'))
              .map(broker => (
                <BrokerCard
                  key={broker.id}
                  broker={broker}
                  selected={selectedBroker === broker.id}
                  onClick={() => onSelect(broker.id)}
                />
              ))}
          </div>
        </div>
      )}

      {/* Crypto Exchanges */}
      {groupedBrokers.crypto.length > 0 && (
        <div>
          <h3 className="text-xs text-zinc-400 uppercase tracking-wider mb-3">
            암호화폐
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {groupedBrokers.crypto.map(broker => (
              <BrokerCard
                key={broker.id}
                broker={broker}
                selected={selectedBroker === broker.id}
                onClick={() => onSelect(broker.id)}
              />
            ))}
          </div>
        </div>
      )}

      <Button
        fullWidth
        disabled={!selectedBroker}
        onClick={onNext}
      >
        다음 단계
      </Button>
    </div>
  )
}

function BrokerCard({
  broker,
  selected,
  onClick,
}: {
  broker: BrokerInfo
  selected: boolean
  onClick: () => void
}) {
  const [notificationRequested, setNotificationRequested] = useState(false)

  const difficultyColor = {
    very_easy: 'text-emerald-400',
    easy: 'text-green-400',
    medium: 'text-yellow-400',
    hard: 'text-orange-400',
  }

  // P0-7: coming_soon/unavailable은 선택 불가
  const isSelectable = broker.status === 'supported' || broker.status === 'beta'

  const handleNotificationRequest = (e: React.MouseEvent) => {
    e.stopPropagation()
    setNotificationRequested(true)
    // TODO: 실제 알림 신청 API 호출
  }

  return (
    <div
      className={clsx(
        'p-4 rounded-lg border transition-all',
        !isSelectable && 'opacity-60',
        isSelectable && selected && 'border-white/20 bg-white/[0.04]',
        !selected && 'border-white/[0.06]'
      )}
    >
      <button
        onClick={isSelectable ? onClick : undefined}
        disabled={!isSelectable}
        className={clsx(
          'w-full text-left',
          isSelectable && 'cursor-pointer',
          !isSelectable && 'cursor-not-allowed'
        )}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm text-white font-medium">{broker.nameKr}</p>
              <BrokerStatusBadge status={broker.status} />
            </div>
            <p className="text-xs text-zinc-400">{broker.name}</p>
          </div>
          {selected && (
            <div className="text-emerald-400">
              <CheckIcon className="w-5 h-5" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={difficultyColor[broker.difficulty]}>
            {broker.difficulty === 'very_easy' ? '매우 쉬움' :
             broker.difficulty === 'easy' ? '쉬움' :
             broker.difficulty === 'medium' ? '보통' : '어려움'}
          </span>
          <span className="text-zinc-400">|</span>
          <span className="text-zinc-500">{broker.setupTime}</span>
          {broker.paperTrading && (
            <>
              <span className="text-zinc-400">|</span>
              <span className="text-blue-400">모의투자</span>
            </>
          )}
        </div>
      </button>

      {/* P0-7: coming_soon 알림 받기 버튼 */}
      {broker.status === 'coming_soon' && (
        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <button
            onClick={handleNotificationRequest}
            disabled={notificationRequested}
            className={clsx(
              'w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              notificationRequested
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-not-allowed'
                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20'
            )}
          >
            {notificationRequested ? '✓ 알림 신청 완료' : '🔔 출시 알림 받기'}
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================
// Credentials Step
// ============================================

function CredentialsStep({
  broker,
  credentials,
  onChange,
  onConnect,
  onBack,
  isLoading,
  error,
}: {
  broker: BrokerInfo
  credentials: BrokerCredentials
  onChange: (creds: BrokerCredentials) => void
  onConnect: () => void
  onBack: () => void
  isLoading: boolean
  error?: string
}) {
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        뒤로
      </button>

      <div className="flex items-center gap-4 p-4 rounded-lg border border-white/[0.06]">
        <div className="w-12 h-12 rounded-lg bg-white/[0.04] flex items-center justify-center text-white text-[20px] font-semibold">
          {broker.nameKr.charAt(0)}
        </div>
        <div>
          <p className="text-sm text-white font-medium">{broker.nameKr}</p>
          <p className="text-xs text-zinc-400">{broker.name}</p>
        </div>
      </div>

      {/* API Guide Link */}
      <a
        href={broker.guideUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15 transition-colors"
      >
        <span className="text-xs text-blue-400">
          API 키 발급 가이드 보기
        </span>
        <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 text-blue-400" />
      </a>

      {/* Credentials Form */}
      <div className="space-y-4">
        <Input
          label="API Key"
          placeholder="API 키를 입력하세요"
          value={credentials.apiKey}
          onChange={(e) => onChange({ ...credentials, apiKey: e.target.value })}
        />

        <Input
          label="API Secret"
          type="password"
          placeholder="API Secret을 입력하세요"
          value={credentials.apiSecret}
          onChange={(e) => onChange({ ...credentials, apiSecret: e.target.value })}
        />

        {(broker.id === 'kis' || broker.id === 'kiwoom') && (
          <Input
            label="계좌번호"
            placeholder="계좌번호를 입력하세요"
            value={credentials.accountNumber || ''}
            onChange={(e) => onChange({ ...credentials, accountNumber: e.target.value })}
          />
        )}

        {broker.paperTrading && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-400">투자 유형</p>
            <div className="flex gap-2">
              <button
                onClick={() => onChange({ ...credentials, accountType: 'paper' })}
                className={clsx(
                  'flex-1 py-2.5 rounded text-sm transition-colors',
                  credentials.accountType === 'paper'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-white/[0.04] text-zinc-400 border border-white/[0.06] hover:bg-white/[0.06]'
                )}
              >
                모의투자
              </button>
              <button
                onClick={() => onChange({ ...credentials, accountType: 'real' })}
                className={clsx(
                  'flex-1 py-2.5 rounded text-sm transition-colors',
                  credentials.accountType === 'real'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/[0.04] text-zinc-400 border border-white/[0.06] hover:bg-white/[0.06]'
                )}
              >
                실전투자
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}
      </div>

      <Button
        fullWidth
        onClick={onConnect}
        isLoading={isLoading}
        disabled={!credentials.apiKey || !credentials.apiSecret}
      >
        연결하기
      </Button>

      <p className="text-xs text-zinc-400 text-center">
        API 정보는 암호화되어 안전하게 저장됩니다
      </p>
    </div>
  )
}

// ============================================
// Success Step
// ============================================

function SuccessStep({
  broker,
  onClose,
}: {
  broker: BrokerInfo
  onClose: () => void
}) {
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
        <CheckIcon className="w-8 h-8 text-emerald-400" />
      </div>

      <div>
        <h3 className="text-[16px] text-white font-medium mb-2">연결 완료!</h3>
        <p className="text-sm text-zinc-400">
          {broker.nameKr}와(과) 성공적으로 연결되었습니다
        </p>
      </div>

      <Button fullWidth onClick={onClose}>
        완료
      </Button>
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export function BrokerConnectWizard({
  onConnect,
  onCancel,
  defaultBroker,
}: BrokerConnectWizardProps) {
  const [step, setStep] = useState<WizardStep>(defaultBroker ? 'credentials' : 'select')
  const [selectedBroker, setSelectedBroker] = useState<BrokerId | null>(defaultBroker || null)
  const [credentials, setCredentials] = useState<BrokerCredentials>({
    apiKey: '',
    apiSecret: '',
    accountType: 'paper',
  })
  const [error, setError] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)

  const brokerInfo = selectedBroker
    ? SUPPORTED_BROKERS.find(b => b.id === selectedBroker)
    : null

  const handleConnect = async () => {
    if (!selectedBroker || !onConnect) return

    setIsLoading(true)
    setError(undefined)

    try {
      await onConnect(selectedBroker, credentials)
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : '연결에 실패했습니다')
      setStep('error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {step === 'select' && '증권사 연결'}
          {step === 'credentials' && 'API 정보 입력'}
          {step === 'connecting' && '연결 중...'}
          {step === 'success' && '연결 완료'}
          {step === 'error' && 'API 정보 입력'}
        </CardTitle>
        <CardDescription>
          {step === 'select' && '연결할 증권사 또는 거래소를 선택하세요'}
          {step === 'credentials' && 'API 키를 입력하여 연결합니다'}
          {step === 'connecting' && '잠시만 기다려주세요'}
          {step === 'success' && '이제 자동매매를 시작할 수 있습니다'}
          {step === 'error' && '연결 정보를 확인해주세요'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {step === 'select' && (
          <BrokerSelectStep
            brokers={SUPPORTED_BROKERS}
            selectedBroker={selectedBroker}
            onSelect={setSelectedBroker}
            onNext={() => setStep('credentials')}
          />
        )}

        {(step === 'credentials' || step === 'error') && brokerInfo && (
          <CredentialsStep
            broker={brokerInfo}
            credentials={credentials}
            onChange={setCredentials}
            onConnect={handleConnect}
            onBack={() => {
              setStep('select')
              setError(undefined)
            }}
            isLoading={isLoading}
            error={error}
          />
        )}

        {step === 'success' && brokerInfo && (
          <SuccessStep
            broker={brokerInfo}
            onClose={() => onCancel?.()}
          />
        )}
      </CardContent>
    </Card>
  )
}

export default BrokerConnectWizard
