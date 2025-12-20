'use client'

import { memo, useState } from 'react'
import { useI18n } from '@/i18n/client'
import { BG_COLORS, PHASE_COLORS } from '@/constants/design-tokens'

// ============================================
// HEPHAITOS FAQ Section
// Supabase-inspired minimal design
// ============================================

interface FAQItem {
  questionKo: string
  questionEn: string
  answerKo: string
  answerEn: string
  category: string
  categoryEn: string
}

const faqs: FAQItem[] = [
  {
    questionKo: '투자 조언인가요?',
    questionEn: 'Is this investment advice?',
    answerKo: '아닙니다. HEPHAITOS는 교육 및 분석 도구입니다. 투자 결정은 본인의 판단과 책임입니다. 우리는 전략 생성 도구와 백테스팅 기능을 제공하며, 모든 결과는 교육 목적입니다.',
    answerEn: 'No. HEPHAITOS is an educational and analysis tool. Investment decisions are your own judgment and responsibility. We provide strategy generation tools and backtesting features, all for educational purposes.',
    category: '법률',
    categoryEn: 'Legal',
  },
  {
    questionKo: '전략 엔진, 진짜 효과 있나요?',
    questionEn: 'Does the strategy engine really work?',
    answerKo: '백테스팅 결과를 투명하게 공개합니다. 과거 10년 데이터로 검증하며, Sharpe Ratio, 최대 손실률 등 모든 지표를 확인할 수 있습니다. 다만 과거 성과가 미래 수익을 보장하지 않습니다.',
    answerEn: 'We transparently show backtesting results. Validated with 10 years of historical data, showing all metrics like Sharpe Ratio and max drawdown. However, past performance does not guarantee future returns.',
    category: '성능',
    categoryEn: 'Performance',
  },
  {
    questionKo: '증권사 연동이 어렵지 않나요?',
    questionEn: 'Is broker integration difficult?',
    answerKo: '3분이면 완료됩니다. 현재 한국투자증권(KIS)을 지원하며, 키움증권·Alpaca는 준비중입니다. API 키만 입력하면 자동으로 연결됩니다.',
    answerEn: 'It takes just 3 minutes. Currently supporting Korea Investment & Securities (KIS), with Kiwoom and Alpaca coming soon. Just enter your API key and it auto-connects.',
    category: '기술',
    categoryEn: 'Tech',
  },
  {
    questionKo: '월 구독료가 부담돼요',
    questionEn: 'Monthly subscription is too expensive',
    answerKo: '구독제가 아닙니다! 크레딧 기반으로 쓴 만큼만 결제합니다. 전략 생성 1회에 10 크레딧, 100 크레딧 패키지가 ₩9,900입니다. 신규 가입 시 50 크레딧 무료 제공.',
    answerEn: 'No subscription! Pay-as-you-go with credits. Strategy generation costs 10 credits, 100 credit package is $7.99. New users get 50 free credits.',
    category: '가격',
    categoryEn: 'Pricing',
  },
  {
    questionKo: '코딩을 전혀 모르는데 가능할까요?',
    questionEn: 'I don\'t know any coding. Is it possible?',
    answerKo: '100% 가능합니다. "RSI 30 이하면 매수"처럼 자연어로 입력하면 전략 엔진이 자동 생성합니다. 드래그앤드롭으로도 전략을 만들 수 있으며, 코드를 볼 필요도 없습니다.',
    answerEn: '100% possible. Just type natural language like "Buy when RSI below 30" and the strategy engine auto-generates it. You can also build with drag-and-drop, no code needed.',
    category: '사용성',
    categoryEn: 'Usability',
  },
  {
    questionKo: '손실이 나면 책임져주나요?',
    questionEn: 'Are you responsible for my losses?',
    answerKo: '아닙니다. 모든 투자 결정과 손실은 사용자 본인의 책임입니다. HEPHAITOS는 도구만 제공하며, 수익을 보장하지 않습니다. 손실 가능 금액 내에서만 투자하는 것을 권장합니다.',
    answerEn: 'No. All investment decisions and losses are your own responsibility. HEPHAITOS only provides tools and does not guarantee returns. Only invest what you can afford to lose.',
    category: '리스크',
    categoryEn: 'Risk',
  },
]

const categoryColors: Record<string, string> = {
  '법률': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Legal': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  '성능': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Performance': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  '기술': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Tech': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  '가격': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Pricing': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  '사용성': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Usability': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  '리스크': 'bg-red-500/10 text-red-400 border-red-500/20',
  'Risk': 'bg-red-500/10 text-red-400 border-red-500/20',
}

export const FAQSection = memo(function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const { locale } = useI18n()
  const isKo = locale === 'ko'

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className={`py-24 ${BG_COLORS.secondary}`}>
      <div className="max-w-3xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-sm text-amber-500 font-medium mb-3">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-4">
            {isKo ? '자주 묻는 질문' : 'Frequently Asked Questions'}
          </h2>
          <p className="text-zinc-400">
            {isKo
              ? '궁금한 점이 있으신가요? 아래에서 답변을 확인할 수 있습니다.'
              : 'Have questions? Find answers below.'}
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            const category = isKo ? faq.category : faq.categoryEn

            return (
              <div
                key={index}
                className={`bg-zinc-900/50 border rounded-lg transition-colors ${
                  isOpen ? 'border-amber-500/30' : 'border-zinc-800'
                }`}
              >
                {/* Question Button */}
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-zinc-900/50 transition-colors"
                >
                  <div className="flex-1 pr-4">
                    <span className={`inline-flex px-2 py-0.5 mb-2 rounded text-xs font-medium border ${
                      categoryColors[category] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                    }`}>
                      {category}
                    </span>
                    <p className={`text-sm font-medium transition-colors ${
                      isOpen ? 'text-amber-400' : 'text-white'
                    }`}>
                      {isKo ? faq.questionKo : faq.questionEn}
                    </p>
                  </div>
                  <span className={`text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    ↓
                  </span>
                </button>

                {/* Answer */}
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    maxHeight: isOpen ? '300px' : '0',
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <div className="px-5 pb-5">
                    <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-lg">
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {isKo ? faq.answerKo : faq.answerEn}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <p className="text-sm text-zinc-400 mb-4">
            {isKo ? '더 궁금한 점이 있으신가요?' : 'Still have questions?'}
          </p>
          <a
            href="mailto:support@hephaitos.io"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-sm text-white transition-colors"
          >
            {isKo ? '문의하기' : 'Contact Us'}
          </a>
        </div>
      </div>
    </section>
  )
})

FAQSection.displayName = 'FAQSection'

export { FAQSection as default }
