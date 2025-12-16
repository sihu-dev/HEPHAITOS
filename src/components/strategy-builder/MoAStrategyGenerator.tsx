'use client';

/**
 * MoA Strategy Generator Component
 *
 * 4명의 전문가 AI가 협업하여 전략을 생성하는 UI
 * - Progressive loading (각 Perspective 순차 표시)
 * - Glass morphism design
 * - 3-tier pricing (Draft / Refined / Comprehensive)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';

interface Perspective {
  perspectiveId: string;
  name: string;
  icon: string;
  output: string;
  tokensUsed: number;
  latency: number;
  confidence: number;
  model: string;
}

interface MoAResult {
  tier: 'draft' | 'refined' | 'comprehensive';
  perspectives: Perspective[];
  aggregated: string;
  validated: boolean;
  validationIssues?: string[];
  totalCost: number;
  totalLatency: number;
}

const TIER_CONFIG = {
  draft: {
    label: '초안',
    credits: 5,
    price: '₩355',
    description: '1명 AI가 빠르게 초안 생성',
    color: 'bg-gray-500',
  },
  refined: {
    label: '정제',
    credits: 10,
    price: '₩710',
    description: '2명 전문가가 협업',
    color: 'bg-primary',
  },
  comprehensive: {
    label: '종합',
    credits: 20,
    price: '₩1,420',
    description: '4명 전문가 + 안전성 검증',
    color: 'bg-gradient-to-r from-primary to-purple-600',
  },
};

export function MoAStrategyGenerator() {
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedTier, setSelectedTier] = useState<'draft' | 'refined' | 'comprehensive'>('refined');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPerspective, setCurrentPerspective] = useState<string | null>(null);
  const [perspectives, setPerspectives] = useState<Perspective[]>([]);
  const [aggregated, setAggregated] = useState<string | null>(null);
  const [result, setResult] = useState<MoAResult | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setPerspectives([]);
    setAggregated(null);
    setResult(null);
    setCurrentPerspective(null);

    try {
      const response = await fetch('/api/ai/moa-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userPrompt,
          tier: selectedTier,
        }),
      });

      if (!response.ok) {
        throw new Error('전략 생성 실패');
      }

      const data: MoAResult = await response.json();
      setResult(data);
      setPerspectives(data.perspectives);
      setAggregated(data.aggregated);
    } catch (error) {
      console.error('MoA 생성 오류:', error);
      alert('전략 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
      setCurrentPerspective(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          🤖 MoA 전략 생성기
        </h2>
        <p className="text-gray-400">
          4명의 전문가가 협업하여 균형잡힌 전략을 생성합니다
        </p>
      </div>

      {/* Tier Selection */}
      <div className="grid grid-cols-3 gap-4">
        {(Object.keys(TIER_CONFIG) as Array<keyof typeof TIER_CONFIG>).map((tier) => {
          const config = TIER_CONFIG[tier];
          const isSelected = selectedTier === tier;

          return (
            <motion.button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                p-4 rounded-xl border transition-all
                ${isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
                }
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-semibold">{config.label}</span>
                <Badge className={config.color}>{config.credits} 크레딧</Badge>
              </div>
              <p className="text-xs text-gray-400 text-left">{config.description}</p>
              <p className="text-sm text-primary font-semibold mt-2">{config.price}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Input */}
      <Card className="p-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          전략 요청 사항
        </label>
        <Textarea
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder="예: RSI와 이동평균을 활용한 스윙 트레이딩 전략을 만들어주세요. 리스크는 2% 이내로 제한하고, 손절은 반드시 포함해주세요."
          rows={4}
          className="w-full"
        />
        <Button
          onClick={handleGenerate}
          disabled={!userPrompt.trim() || isGenerating}
          className="mt-4 w-full"
        >
          {isGenerating ? (
            <>
              <Spinner size="sm" className="mr-2" />
              생성 중...
            </>
          ) : (
            `${TIER_CONFIG[selectedTier].label} 전략 생성 (${TIER_CONFIG[selectedTier].credits} 크레딧)`
          )}
        </Button>
      </Card>

      {/* Perspectives (Progressive Loading) */}
      <AnimatePresence>
        {perspectives.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-2xl">👥</span>
              전문가 의견
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {perspectives.map((p, index) => (
                <motion.div
                  key={p.perspectiveId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                >
                  <Card className="p-4 bg-white/5 border-white/10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{p.icon}</span>
                        <div>
                          <h4 className="text-white font-semibold">{p.name}</h4>
                          <p className="text-xs text-gray-500">{p.model}</p>
                        </div>
                      </div>
                      <Badge
                        className={
                          p.confidence >= 80
                            ? 'bg-green-500'
                            : p.confidence >= 60
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }
                      >
                        {p.confidence}%
                      </Badge>
                    </div>

                    {/* Content */}
                    <div className="prose prose-sm prose-invert max-w-none">
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap bg-black/20 p-3 rounded-lg overflow-auto max-h-60">
                        {p.output}
                      </pre>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                      <span>{p.tokensUsed} tokens</span>
                      <span>{(p.latency / 1000).toFixed(2)}s</span>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Aggregated Strategy */}
      <AnimatePresence>
        {aggregated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <span className="text-2xl">✨</span>
              종합 전략
            </h3>
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-purple-600/10 border-primary/30">
              {/* Validation Badge */}
              {result && (
                <div className="mb-4">
                  {result.validated ? (
                    <Badge className="bg-green-500">
                      ✅ 검증 완료
                    </Badge>
                  ) : (
                    <div>
                      <Badge className="bg-red-500 mb-2">
                        ⚠️ 검증 이슈 발견
                      </Badge>
                      <ul className="text-xs text-red-400 ml-4 list-disc">
                        {result.validationIssues?.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Strategy Content */}
              <div className="prose prose-invert max-w-none">
                <div className="text-gray-200 whitespace-pre-wrap">
                  {aggregated}
                </div>
              </div>

              {/* Metadata */}
              {result && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">총 비용</p>
                      <p className="text-white font-semibold">
                        ${result.totalCost.toFixed(4)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">생성 시간</p>
                      <p className="text-white font-semibold">
                        {(result.totalLatency / 1000).toFixed(1)}s
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">전문가</p>
                      <p className="text-white font-semibold">
                        {result.perspectives.length}명
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <Button variant="primary" className="flex-1">
                  📊 백테스팅 실행
                </Button>
                <Button variant="secondary" className="flex-1">
                  💾 전략 저장
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {isGenerating && currentPerspective && (
        <Card className="p-4 bg-primary/10 border-primary/30">
          <div className="flex items-center gap-3">
            <Spinner size="sm" />
            <p className="text-white">
              {currentPerspective} 의견 생성 중...
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
