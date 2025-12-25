# HEPHAITOS Private Beta 준비 가이드 (50명)

> **목표**: 고품질 피드백을 제공할 수 있는 50명의 베타 테스터 확보
> **기간**: 2025-02-10 - 2025-02-23 (2주)
> **작성일**: 2025-12-22

---

## 📋 목차

1. [베타 유저 선정 기준](#베타-유저-선정-기준)
2. [50명 리스트 템플릿](#50명-리스트-템플릿)
3. [초대 이메일 템플릿](#초대-이메일-템플릿)
4. [온보딩 프로세스](#온보딩-프로세스)
5. [Discord 서버 설정](#discord-서버-설정)
6. [피드백 수집 시스템](#피드백-수집-시스템)
7. [베타 특전 및 인센티브](#베타-특전-및-인센티브)

---

## 베타 유저 선정 기준

### 목표 페르소나 분포

| 페르소나 | 인원 | 비율 | 선정 이유 |
|---------|------|------|----------|
| **직장인 개미 (민수형)** | 25명 | 50% | 핵심 타겟, 구매력 높음 |
| **대학생 퀀트 지망생 (지현형)** | 15명 | 30% | 피드백 품질 높음, 전파력 |
| **은퇴 준비 투자자 (영호형)** | 10명 | 20% | 장기 고객 가능성, 안정성 중시 |

### 선정 체크리스트

**필수 조건 (Hard Criteria)**:
- [ ] 한국어 사용자
- [ ] 이메일 주소 보유
- [ ] 투자 경험 1년 이상
- [ ] 피드백 제공 의지

**우대 조건 (Soft Criteria)**:
- [ ] 코딩 경험 (Python/JavaScript)
- [ ] 퀀트 투자 관심
- [ ] 소셜 미디어 활동 (전파력)
- [ ] 유료 구독 의향

### 소싱 채널

| 채널 | 예상 인원 | 방법 |
|------|----------|------|
| **Twitter/X** | 15명 | #퀀트투자 #개발자 해시태그 |
| **LinkedIn** | 10명 | IT 업계 종사자 직접 DM |
| **Reddit** | 10명 | r/KoreanInvesting, r/algotrading |
| **지인 추천** | 10명 | 친구/동료 네트워크 |
| **온라인 커뮤니티** | 5명 | 디시인사이드, 뽐뿌 |

---

## 50명 리스트 템플릿

### 스프레드시트 구조

**파일명**: `Private_Beta_Users_50.xlsx`

| 열 | 데이터 | 예시 | 필수 |
|----|--------|------|------|
| A | ID | 1-50 | ✅ |
| B | 이름 | 김민수 | ✅ |
| C | 이메일 | minsu@example.com | ✅ |
| D | 페르소나 | 직장인 개미 | ✅ |
| E | 투자 경험 | 3년 | ✅ |
| F | 코딩 경험 | Python 중급 | ⭕ |
| G | 초대 날짜 | 2025-02-10 | ✅ |
| H | 가입 날짜 | 2025-02-12 | ⭕ |
| I | 가입 여부 | Y/N | ✅ |
| J | 활동 점수 | 0-100 | ⭕ |
| K | 피드백 횟수 | 0-10 | ⭕ |
| L | 소싱 채널 | Twitter | ✅ |
| M | 비고 | 적극적 피드백 | ⭕ |

### CSV 템플릿

```csv
id,name,email,persona,investment_exp,coding_exp,invite_date,signup_date,signed_up,activity_score,feedback_count,source_channel,notes
1,김민수,minsu@example.com,직장인개미,3년,Python중급,2025-02-10,,N,0,0,Twitter,퀀트 관심 높음
2,이지현,jihyun@example.com,대학생,1년,Python초급,2025-02-10,,N,0,0,Reddit,금융공학 전공
3,박영호,youngho@example.com,은퇴준비,10년,없음,2025-02-10,,N,0,0,지인추천,안정적 투자 선호
...
```

### 리스트 관리 도구

**Google Sheets 추천**:
- 실시간 협업 가능
- 자동 알림 설정 (가입 시)
- 필터/정렬 기능

**URL**: https://sheets.google.com/create

---

## 초대 이메일 템플릿

### 템플릿 1: 첫 초대 (25명 - 1차)

**제목**: 🔥 [HEPHAITOS] Private Beta 초대장이 도착했습니다

**본문**:
```html
<!DOCTYPE html>
<html>
<body style="font-family: 'Pretendard', -apple-system, sans-serif; background-color: #0D0D0F; color: #FFFFFF; padding: 40px;">
  <div style="max-width: 600px; margin: 0 auto; background: rgba(255,255,255,0.03); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 40px;">

    <!-- 헤더 -->
    <h1 style="font-size: 28px; margin-bottom: 8px; background: linear-gradient(135deg, #FFFFFF 0%, #A1A1AA 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
      HEPHAITOS Private Beta
    </h1>
    <p style="font-size: 14px; color: #71717A; margin-bottom: 32px;">
      코딩 없이, 자연어로 AI 트레이딩 봇을 만드세요
    </p>

    <!-- 인사 -->
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      안녕하세요, <strong>{{이름}}</strong>님!
    </p>

    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      HEPHAITOS Private Beta에 초대합니다. 🎉<br>
      코딩 없이 자연어만으로 나만의 AI 트레이딩 시스템을 구축할 수 있습니다.
    </p>

    <!-- CTA 버튼 -->
    <a href="https://hephaitos.io/beta?code={{초대코드}}"
       style="display: inline-block; background: linear-gradient(135deg, #5E6AD2 0%, #4B56C8 100%); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-bottom: 32px; box-shadow: 0 0 20px rgba(94, 106, 210, 0.3);">
      🚀 지금 시작하기
    </a>

    <!-- 베타 특전 -->
    <div style="background: rgba(94, 106, 210, 0.08); border: 1px solid rgba(94, 106, 210, 0.2); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h3 style="font-size: 18px; margin-bottom: 16px;">🎁 베타 테스터 특전</h3>
      <ul style="font-size: 14px; line-height: 1.8; padding-left: 20px;">
        <li><strong>무제한 백테스트</strong> (정식 출시 후 100회/월)</li>
        <li><strong>Pro 기능 3개월 무료</strong> (₩89,700 상당)</li>
        <li><strong>피드백 제공 시 1년 구독권</strong> (₩358,800 상당)</li>
        <li><strong>런칭 이벤트 우선 참여권</strong></li>
      </ul>
    </div>

    <!-- 주요 기능 -->
    <h3 style="font-size: 18px; margin-bottom: 16px;">💡 주요 기능</h3>
    <ul style="font-size: 14px; line-height: 1.8; padding-left: 20px; margin-bottom: 24px;">
      <li><strong>Copy</strong>: Nancy Pelosi, Warren Buffett 포트폴리오 1클릭 복사</li>
      <li><strong>Learn</strong>: AI 멘토가 "왜?"를 설명해줍니다</li>
      <li><strong>Build</strong>: "RSI 30 이하에서 매수해줘" → Python 전략 자동 생성</li>
    </ul>

    <!-- 피드백 요청 -->
    <p style="font-size: 14px; line-height: 1.6; color: #A1A1AA; margin-bottom: 16px;">
      베타 테스터로서 여러분의 피드백이 HEPHAITOS의 미래를 결정합니다.<br>
      Discord에서 편하게 의견을 나눠주세요!
    </p>

    <!-- Discord 초대 -->
    <a href="https://discord.gg/hephaitos-beta"
       style="display: inline-block; background: #5865F2; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; margin-bottom: 32px;">
      💬 Discord 참여하기
    </a>

    <!-- 푸터 -->
    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 32px 0;">

    <p style="font-size: 12px; color: #71717A; line-height: 1.6;">
      기대하겠습니다!<br>
      <strong>HEPHAITOS Team</strong>
    </p>

    <p style="font-size: 12px; color: #52525B; line-height: 1.6; margin-top: 16px;">
      초대 코드: <code style="background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 4px;">{{초대코드}}</code><br>
      유효 기간: 2025-02-17까지 (7일)
    </p>

    <p style="font-size: 11px; color: #3F3F46; margin-top: 24px;">
      ※ 본 서비스는 교육 및 도구를 제공하며, 투자 조언을 제공하지 않습니다.<br>
      모든 투자 결정과 그에 따른 손익은 사용자 본인의 책임입니다.
    </p>
  </div>
</body>
</html>
```

### 템플릿 2: 리마인더 (미가입자 대상)

**제목**: ⏰ [HEPHAITOS] 초대 기한이 3일 남았습니다

**본문**:
```
안녕하세요, {{이름}}님!

HEPHAITOS Private Beta 초대를 아직 확인하지 못하셨나요?
초대 기한이 3일 남았습니다. (2025-02-17까지)

[지금 시작하기] 버튼

50명 한정이며, 초과 신청자는 대기 명단에 등록됩니다.
지금 바로 참여하세요!

감사합니다,
HEPHAITOS Team
```

### 템플릿 3: 환영 이메일 (가입 후 자동 발송)

**제목**: 🎉 환영합니다! HEPHAITOS 시작 가이드

**본문**:
```html
안녕하세요, {{이름}}님!

HEPHAITOS에 가입해주셔서 감사합니다. 🎉

<h2>🚀 3분 시작 가이드</h2>

1️⃣ **Nancy Pelosi 포트폴리오 따라하기** (Copy 모드)
   - Dashboard > Copy > Nancy Pelosi 선택
   - "1클릭 미러링" 버튼 클릭

2️⃣ **AI 멘토에게 물어보기** (Learn 모드)
   - "왜 NVDA를 샀나요?" 입력
   - AI가 배경 분석 제공

3️⃣ **첫 전략 만들기** (Build 모드)
   - Strategy Builder 열기
   - "RSI 30 이하에서 매수해줘" 입력
   - 백테스트 실행

<h2>📚 유용한 링크</h2>
- 📖 [사용자 가이드](https://hephaitos.io/docs)
- 💬 [Discord 커뮤니티](https://discord.gg/hephaitos-beta)
- 📝 [피드백 제출](https://forms.gle/hephaitos-feedback)

<h2>🎁 베타 특전 확인</h2>
- ✅ 무제한 백테스트 활성화됨
- ✅ Pro 기능 3개월 무료 (2025-05-10까지)
- ⏳ 피드백 1회 제출 시 1년 구독권 지급

Discord에서 뵙겠습니다!

HEPHAITOS Team
```

---

## 온보딩 프로세스

### 온보딩 플로우

```
초대 이메일 발송
    ↓
초대 링크 클릭 (코드 검증)
    ↓
회원가입 (Google/Kakao OAuth)
    ↓
환영 이메일 자동 발송
    ↓
온보딩 튜토리얼 (첫 로그인 시)
    ↓
Discord 초대
    ↓
첫 전략 생성 (가이드)
    ↓
피드백 제출 안내
```

### 온보딩 튜토리얼 (In-App)

**단계별 가이드** (`/dashboard/onboarding`):

1. **Step 1: Copy 모드 체험** (2분)
   - Nancy Pelosi 포트폴리오 조회
   - 1클릭 미러링 버튼 클릭
   - 실시간 알림 설정

2. **Step 2: Learn 모드 체험** (3분)
   - "왜 이 주식을 샀나요?" 질문
   - AI 분석 리포트 확인

3. **Step 3: Build 모드 체험** (5분)
   - 자연어로 전략 생성
   - 백테스트 실행
   - 결과 분석

4. **Step 4: 피드백 제출** (2분)
   - 첫 인상 공유
   - 불편한 점 제보

**완료 보상**:
- 🎁 1,000 크레딧 지급
- 🏆 "Early Adopter" 뱃지

---

## Discord 서버 설정

### 서버 구조

```
📢 공지
  ├─ #announcements (읽기 전용)
  └─ #updates (패치 노트)

💬 커뮤니티
  ├─ #general (자유 대화)
  ├─ #introductions (자기소개)
  └─ #off-topic (잡담)

🐛 피드백 & 지원
  ├─ #bug-reports (버그 리포트)
  ├─ #feature-requests (기능 제안)
  └─ #help (질문/답변)

📚 학습
  ├─ #strategy-sharing (전략 공유)
  ├─ #tutorials (튜토리얼)
  └─ #market-insights (시장 분석)

👑 베타 테스터
  └─ #beta-exclusive (특별 채널)
```

### 역할 (Roles)

| 역할 | 색상 | 권한 | 조건 |
|------|------|------|------|
| **👑 Founder** | 금색 | 전체 관리 | 팀원 |
| **🛡️ Moderator** | 파란색 | 채팅 관리 | 활동 유저 |
| **🔥 Beta Tester** | 주황색 | #beta-exclusive 접근 | 50명 |
| **💎 Pro User** | 보라색 | Pro 기능 사용자 | 유료 구독 |
| **🌱 New Member** | 초록색 | 기본 권한 | 가입 직후 |

### 환영 메시지 (Auto DM)

```
안녕하세요, {{username}}님! 👋

HEPHAITOS Discord에 오신 것을 환영합니다!

먼저 #introductions 채널에서 자기소개 부탁드립니다:
- 투자 경험
- HEPHAITOS에 기대하는 점
- 관심 전략 유형

질문이 있으시면 #help 채널에서 언제든 물어보세요!

함께 성장하는 커뮤니티를 만들어가요 🚀

HEPHAITOS Team
```

### 봇 기능 (Discord Bot)

**필수 기능**:
- 자동 역할 부여 (Beta Tester)
- 환영 메시지 자동 발송
- 버그 리포트 템플릿 제공

**선택 기능**:
- 전략 공유 시 자동 포맷팅
- 시장 뉴스 자동 포스팅
- 활동 포인트 시스템

---

## 피드백 수집 시스템

### 1. Google Form 설문

**URL**: https://forms.gle/hephaitos-beta-feedback

**질문 구성** (10개, 5분 소요):

1. **NPS 점수** (필수)
   - HEPHAITOS를 친구에게 추천하시겠습니까?
   - 0-10점 척도

2. **전반적 만족도** (필수)
   - 5점 척도 (매우 불만족 ~ 매우 만족)

3. **가장 유용한 기능** (필수)
   - Copy / Learn / Build 중 선택

4. **가장 불편한 점** (필수)
   - 텍스트 입력

5. **사용 빈도** (필수)
   - 주 1회 미만 / 주 2-3회 / 거의 매일

6. **백테스트 대기시간 만족도** (필수)
   - 매우 느림 / 느림 / 적당 / 빠름 / 매우 빠름

7. **UI/UX 개선 제안** (선택)
   - 텍스트 입력

8. **유료 구독 의향** (필수)
   - 월 ₩29,900에 구독하시겠습니까?
   - 예 / 아니요 / 고민 중

9. **적정 가격** (조건부)
   - "아니요" 선택 시: 적정 가격은?
   - ₩9,900 / ₩19,900 / ₩29,900 / ₩39,900

10. **추가 의견** (선택)
    - 텍스트 입력

### 2. 1:1 인터뷰 (주 2회)

**대상**: 주간 10명 선정 (활동 점수 기반)

**질문 가이드** (30분):
1. 첫 인상은 어땠나요?
2. 가장 기대했던 기능은?
3. 실제로 사용해보니 어떤가요?
4. 가장 불편한 점 3가지는?
5. 경쟁 서비스 대비 장점은?
6. 어떤 기능이 추가되면 유료로 구독하시겠어요?
7. 누구에게 추천하고 싶으세요?

**보상**:
- 🎁 스타벅스 기프티콘 ₩10,000

### 3. 행동 데이터 수집 (Analytics)

**추적 이벤트**:
```typescript
// 가입 관련
track('user_signed_up', { source: 'beta_invite' })
track('onboarding_completed', { duration_seconds: 300 })

// 기능 사용
track('strategy_created', { type: 'natural_language' })
track('backtest_started', { strategy_id: 'xxx' })
track('portfolio_mirrored', { celeb: 'Nancy Pelosi' })

// 이탈
track('session_ended', { duration_seconds: 1200 })
track('unsubscribed', { reason: 'too_expensive' })
```

**Mixpanel/Amplitude 대시보드**:
- DAU/MAU 추이
- 기능별 사용률
- 퍼널 분석 (가입 → 첫 전략 → 백테스트)

---

## 베타 특전 및 인센티브

### 특전 요약

| 특전 | 가치 | 조건 | 지급 방식 |
|------|------|------|----------|
| **무제한 백테스트** | ₩29,900/월 | 자동 적용 | 베타 기간 내 |
| **Pro 기능 3개월** | ₩89,700 | 자동 적용 | 가입 후 즉시 |
| **1년 구독권** | ₩358,800 | 피드백 1회 제출 | 수동 지급 |
| **Early Adopter 뱃지** | - | 온보딩 완료 | 자동 지급 |
| **런칭 이벤트 초대** | - | 활동 점수 상위 20% | 별도 연락 |

### 피드백 보상 시스템

**티어 시스템**:

| 티어 | 조건 | 보상 |
|------|------|------|
| **Bronze** | 피드백 1회 | 1년 구독권 |
| **Silver** | 피드백 3회 + 버그 리포트 1회 | 1년 구독권 + Pro 평생 |
| **Gold** | 1:1 인터뷰 참여 | 2년 구독권 + 런칭 이벤트 VIP |

### 추천 프로그램

**"친구 초대하기"**:
- 추천인: 추천 1명당 1개월 무료 구독 (+₩29,900)
- 피추천인: 첫 달 50% 할인 (₩14,950)

**바이럴 효과**:
- 목표: 베타 유저 1인당 평균 2명 추천
- 50명 → 100명 → 200명 (자연 증가)

---

## 체크리스트: Private Beta 런칭 전

### 유저 리스트 준비

- [ ] 50명 리스트 작성 완료
- [ ] 페르소나 분포 확인 (50% / 30% / 20%)
- [ ] 이메일 주소 검증 (유효성 확인)
- [ ] 초대 코드 생성 (UUID v4)

### 이메일 시스템

- [ ] 이메일 템플릿 3종 작성 (초대/리마인더/환영)
- [ ] Resend/SendGrid 계정 설정
- [ ] 발송 테스트 (팀원 이메일로)
- [ ] 스팸 필터 회피 확인 (Gmail/Naver)

### Discord 서버

- [ ] 서버 생성 + 채널 구조 설정
- [ ] 역할 시스템 설정
- [ ] 환영 메시지 봇 설정
- [ ] 초대 링크 생성 (7일 제한 없음)

### 피드백 시스템

- [ ] Google Form 설문 작성
- [ ] 1:1 인터뷰 캘린더 공유 (Calendly)
- [ ] Analytics 이벤트 트래킹 설정
- [ ] Mixpanel/Amplitude 대시보드 구축

### 온보딩 프로세스

- [ ] 온보딩 튜토리얼 UI 구현
- [ ] 자동 이메일 발송 로직 구현
- [ ] 크레딧 지급 시스템 테스트
- [ ] Early Adopter 뱃지 생성

---

## 다음 단계

**Private Beta 완료 후**:

1. **피드백 분석** (Week 10)
   - NPS 점수 계산
   - 불편한 점 Top 10 취합
   - 개선 우선순위 설정

2. **Pivot 여부 판단**
   - NPS >40: Public Beta 진행
   - NPS 20-40: 부분 조정
   - NPS <20: 대대적 변경

3. **Public Beta 준비** (Week 11)
   - 서버 인프라 스케일업
   - 마케팅 자료 준비
   - 론칭 이벤트 기획

---

**작성일**: 2025-12-22
**담당자**: Growth Team
**승인**: CMO
