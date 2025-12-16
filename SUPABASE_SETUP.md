# Supabase 설정 가이드

## 1단계: Supabase 프로젝트 정보 확인

### 방법 1: Supabase 대시보드에서 직접 확인

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard/projects
   - 로그인

2. **프로젝트 선택**
   - HEPHAITOS 프로젝트 클릭

3. **Project Settings > API로 이동**
   - 좌측 메뉴에서 ⚙️ Settings 클릭
   - API 탭 선택

4. **필요한 정보 복사**
   ```
   ✅ Project URL (NEXT_PUBLIC_SUPABASE_URL)
   ✅ anon public (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   ✅ service_role (SUPABASE_SERVICE_ROLE_KEY)
   ```

---

## 2단계: .env.local 파일 업데이트

### 현재 상태
```bash
NEXT_PUBLIC_SUPABASE_URL=REDACTED_REPLACE_ME
NEXT_PUBLIC_SUPABASE_ANON_KEY=REDACTED
SUPABASE_SERVICE_ROLE_KEY=REDACTED
```

### 업데이트 필요
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3단계: 파일 직접 수정 방법

### 옵션 A: VSCode에서 수정
```bash
code .env.local
```

### 옵션 B: 메모장에서 수정
```bash
notepad .env.local
```

### 옵션 C: Claude Code로 수정
아래 정보를 제공하면 제가 직접 업데이트합니다:
```
Project URL: [여기에 붙여넣기]
Anon Key: [여기에 붙여넣기]
Service Role Key: [여기에 붙여넣기]
```

---

## 4단계: 서버 재시작

환경변수 변경 후 개발 서버 재시작 필요:
```bash
# 현재 서버 종료 (Ctrl+C)
# 재시작
npm run dev
```

---

## 필요한 Supabase 테이블

HEPHAITOS는 다음 테이블이 필요합니다:

### 핵심 테이블
- ✅ `users` - 사용자 정보
- ✅ `portfolios` - 포트폴리오
- ✅ `strategies` - 트레이딩 전략
- ✅ `trades` - 거래 내역
- ✅ `simulations` - 시뮬레이션 계좌
- ✅ `credit_transactions` - 크레딧 거래 (NEW)

### 마이그레이션 실행
```bash
# Supabase CLI 설치 (한번만)
npm install -g supabase

# 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref your-project-ref

# 마이그레이션 실행
supabase db push
```

---

## 문제 해결

### 에러: "Invalid supabaseUrl"
- .env.local의 URL이 https:// 로 시작하는지 확인
- REDACTED_REPLACE_ME가 남아있는지 확인

### 에러: "Invalid API key"
- anon key는 `eyJ`로 시작해야 함
- service_role key도 `eyJ`로 시작해야 함
- 복사 시 공백이 포함되지 않았는지 확인

### 서버가 재시작되지 않음
```bash
# 프로세스 강제 종료
taskkill /F /IM node.exe

# 다시 시작
npm run dev
```

---

## 다음 단계

환경변수 설정 후:
1. ✅ 서버 재시작
2. ✅ http://localhost:3000 접속
3. ✅ 회원가입/로그인 테스트
4. ✅ 크레딧 시스템 마이그레이션 실행

---

준비되셨나요? Supabase 정보를 제공해주시면 제가 .env.local 파일을 업데이트하겠습니다!
