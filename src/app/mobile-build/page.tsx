'use client'

import { useState, useEffect } from 'react'
import { SearchWidget } from '@/components/mobile-build/SearchWidget'
import { NaturalLanguageBuilder } from '@/components/mobile-build/NaturalLanguageBuilder'
import { CodingSimulation } from '@/components/mobile-build/CodingSimulation'
import { ProfessionalDataPanel } from '@/components/mobile-build/ProfessionalDataPanel'

// ============================================
// 모바일 빌드 페이지 (가로모드 전용)
// Build 카테고리 - 자연어 기반 노드 캔버스 전략 개발
// ============================================

export default function MobileBuildPage() {
  const [isLandscape, setIsLandscape] = useState(true)
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null)
  const [userPrompt, setUserPrompt] = useState('')
  const [isBuilding, setIsBuilding] = useState(false)
  const [buildProgress, setBuildProgress] = useState(0)

  // 가로모드 감지
  useEffect(() => {
    const checkOrientation = () => {
      const isLandscapeMode = window.innerWidth > window.innerHeight
      setIsLandscape(isLandscapeMode)
    }

    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)

    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])

  // 검색 위젯에서 전략 선택 시 (자연어 프롬프트 자동 입력 + 즉시 빌드 시작)
  const handleStrategySelect = async (strategyId: string, naturalPrompt: string) => {
    setSelectedStrategy(strategyId)
    setUserPrompt(naturalPrompt)

    // 자동으로 빌드 프로세스 시작
    setIsBuilding(true)
    setBuildProgress(0)

    // 노드 캔버스 시뮬레이션 (7단계, 각 14.3%)
    const steps = 7
    for (let i = 1; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, 800))
      setBuildProgress(Math.round((i / steps) * 100))
    }

    setIsBuilding(false)
  }

  const handlePromptSubmit = async (prompt: string) => {
    // Enter 키 수동 입력 시에도 동작
    if (!prompt.trim() || isBuilding) return

    setUserPrompt(prompt)
    setIsBuilding(true)
    setBuildProgress(0)

    const steps = 7
    for (let i = 1; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, 800))
      setBuildProgress(Math.round((i / steps) * 100))
    }

    setIsBuilding(false)
  }

  // 세로모드 경고
  if (!isLandscape) {
    return (
      <div className="fixed inset-0 bg-[#0D0D0F] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-6">📱</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            가로모드로 회전해주세요
          </h2>
          <p className="text-zinc-400 text-sm">
            노드 캔버스는 가로모드에서만 사용 가능합니다
          </p>
          <div className="mt-8 inline-block">
            <div className="animate-bounce text-4xl">↻</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#0D0D0F] overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b border-white/[0.06] bg-[#111113] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 flex items-center justify-center">
            <span className="text-lg">🎨</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">전략 개발 스튜디오</h1>
            <p className="text-xs text-zinc-500">자연어 → 알고리즘 시각화</p>
          </div>
        </div>

        {buildProgress > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-white/[0.05] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#5E6AD2] to-[#7C8AEA] transition-all duration-300"
                style={{ width: `${buildProgress}%` }}
              />
            </div>
            <span className="text-xs text-zinc-400">{buildProgress}%</span>
          </div>
        )}
      </div>

      {/* Main Content - Grid Layout */}
      <div className="h-[calc(100vh-3.5rem)] grid grid-cols-5 gap-0">
        {/* Left Panel: 검색 위젯 (1/5) */}
        <div className="col-span-1 border-r border-white/[0.06] bg-[#0D0D0F] overflow-y-auto">
          <SearchWidget
            onStrategySelect={handleStrategySelect}
            selectedStrategy={selectedStrategy}
          />
        </div>

        {/* Center Panel: 자연어 빌더 + 노드 캔버스 (3/5) */}
        <div className="col-span-3 flex flex-col">
          {/* 자연어 입력 */}
          <div className="flex-shrink-0 border-b border-white/[0.06] bg-[#111113]">
            <NaturalLanguageBuilder
              onSubmit={handlePromptSubmit}
              isBuilding={isBuilding}
              selectedStrategy={selectedStrategy}
              initialPrompt={userPrompt}
            />
          </div>

          {/* 노드 캔버스 (ReactFlow) */}
          <div className="flex-1 overflow-hidden">
            <CodingSimulation
              isActive={isBuilding}
              progress={buildProgress}
              userPrompt={userPrompt}
            />
          </div>
        </div>

        {/* Right Panel: 전문 데이터 (1/5) */}
        <div className="col-span-1 border-l border-white/[0.06] bg-[#0D0D0F] overflow-y-auto">
          <ProfessionalDataPanel
            isVisible={!!userPrompt}
            userPrompt={userPrompt}
            buildProgress={buildProgress}
          />
        </div>
      </div>
    </div>
  )
}
