'use client'

import { memo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useI18n } from '@/i18n/client'

// ============================================
// FAQ Section - Accordion Style with i18n
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
    answerKo: '아닙니다. 모든 투자 결정과 손실은 사용자 본인의 책임입니다. HEPHAITOS는 도구만 제공하며, 수익을 보장하지 않습니다. 반드시 손실 가능 금액 내에서만 투자하세요.',
    answerEn: 'No. All investment decisions and losses are your own responsibility. HEPHAITOS only provides tools and does not guarantee returns. Only invest what you can afford to lose.',
    category: '리스크',
    categoryEn: 'Risk',
  },
]

export const FAQSection = memo(function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const { locale } = useI18n()
  const isKo = locale === 'ko'

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-20 bg-[#0D0D0F]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {isKo ? '자주 묻는 질문' : 'Frequently Asked Questions'}
          </h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            {isKo
              ? '궁금한 점이 있으신가요? 아래에서 답변을 확인하세요.'
              : 'Have questions? Find answers below.'}
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index

            return (
              <div
                key={index}
                className="
                  glass
                  rounded-2xl
                  border
                  border-white/[0.06]
                  hover:border-[#5E6AD2]/20
                  transition-all
                  duration-300
                  overflow-hidden
                "
              >
                {/* Question Button */}
                <button
                  onClick={() => toggleFAQ(index)}
                  className="
                    w-full
                    flex
                    items-center
                    justify-between
                    p-6
                    text-left
                    group
                    hover:bg-white/[0.02]
                    transition-colors
                  "
                >
                  <div className="flex-1 pr-4">
                    {/* Category Badge */}
                    <span className="
                      inline-block
                      px-2
                      py-1
                      mb-2
                      rounded-full
                      bg-[#5E6AD2]/10
                      border
                      border-[#5E6AD2]/20
                      text-xs
                      text-[#7C8AEA]
                      font-semibold
                    ">
                      {isKo ? faq.category : faq.categoryEn}
                    </span>

                    {/* Question */}
                    <p className="
                      text-base
                      text-white
                      font-bold
                      group-hover:text-[#5E6AD2]
                      transition-colors
                    ">
                      {isKo ? faq.questionKo : faq.questionEn}
                    </p>
                  </div>

                  {/* Chevron */}
                  <ChevronDown
                    className={`
                      w-5
                      h-5
                      text-zinc-400
                      group-hover:text-[#5E6AD2]
                      transition-all
                      duration-300
                      ${isOpen ? 'rotate-180' : ''}
                    `}
                  />
                </button>

                {/* Answer (Animated) */}
                <div
                  className="
                    overflow-hidden
                    transition-all
                    duration-300
                    ease-in-out
                  "
                  style={{
                    maxHeight: isOpen ? '500px' : '0',
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <div className="px-6 pb-6 pt-0">
                    <div className="
                      p-4
                      rounded-xl
                      bg-white/[0.02]
                      border
                      border-white/[0.04]
                    ">
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
            className="
              inline-flex
              items-center
              gap-2
              px-6
              py-3
              glass
              hover:glass-strong
              rounded-xl
              text-sm
              text-zinc-300
              hover:text-white
              transition-all
              border
              border-white/[0.06]
              hover:border-[#5E6AD2]/20
            "
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {isKo ? '문의하기' : 'Contact Us'}
          </a>
        </div>
      </div>
    </section>
  )
})

FAQSection.displayName = 'FAQSection'

export { FAQSection as default }
