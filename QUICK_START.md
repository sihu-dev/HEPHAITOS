# HEPHAITOS 빠른 시작 가이드 ⚡

> **5분 안에 개발 서버 실행하기**

---

## ✅ 체크리스트

- [ ] Node.js 20+ 설치됨
- [ ] HEPHAITOS 프로젝트 다운로드 완료
- [ ] API 키 1개 이상 발급 (최소: Anthropic)

---

## 🚀 3단계로 시작하기

### 1️⃣ API 키 설정 (5분)

**Option A: 자동 설정** (Windows)
```powershell
cd C:\Users\sihu2\OneDrive\Desktop\Projects\HEPHAITOS
.\scripts\setup-api-keys.ps1
```

**Option B: 수동 설정**
1. Claude AI 키 발급: https://console.anthropic.com/
2. `.env.local` 파일 편집:
   ```env
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

---

### 2️⃣ 데이터베이스 설정 (2분)

1. Supabase 대시보드 접속: https://app.supabase.com/
2. 프로젝트 선택: `demwsktllidwsxahqyvd`
3. SQL Editor 열기
4. 다음 파일 내용 복사 & 실행:
   ```
   supabase/migrations/20251216000001_create_credit_system.sql
   ```

---

### 3️⃣ 개발 서버 실행 (1분)

```bash
cd C:\Users\sihu2\OneDrive\Desktop\Projects\HEPHAITOS
npm run dev
```

브라우저에서 열기: http://localhost:3000

---

## 🧪 선택: API 연결 테스트

```bash
npm run test:api
```

**예상 출력**:
```
✅ Supabase: SUCCESS
✅ Claude AI (Anthropic): SUCCESS
⏭️  KIS (한국투자증권): SKIP (설정 안됨)
⏭️  Polygon.io: SKIP (설정 안됨)
⏭️  토스페이먼츠: SKIP (설정 안됨)

🎉 모든 설정된 API 연결 성공!
```

---

## 📚 다음 단계

### 필수 읽기
1. `API_KEY_SETUP_GUIDE.md` - 모든 API 키 발급 방법
2. `SETUP_COMPLETE.md` - 상세 설정 완료 내용

### 개발 시작
1. `BUSINESS_CONSTITUTION.md` - 사업 원칙
2. `DESIGN_SYSTEM.md` - 디자인 가이드
3. `COPY_STRATEGY.md` - 카피 전략

---

## 🆘 문제 해결

### 개발 서버가 실행되지 않아요
```bash
# 의존성 재설치
npm install

# 캐시 삭제 후 재시작
rm -rf .next
npm run dev
```

### API 연결 테스트 실패
1. `.env.local` 파일에 API 키가 제대로 입력되었는지 확인
2. API 키 앞뒤 공백 제거
3. 각 서비스 대시보드에서 키 유효성 확인

### Supabase 연결 오류
1. `NEXT_PUBLIC_SUPABASE_URL` 확인
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` 확인
3. Supabase 프로젝트가 활성 상태인지 확인

---

## 💡 유용한 명령어

```bash
# 개발
npm run dev              # 개발 서버 실행
npm run build            # 프로덕션 빌드
npm run start            # 프로덕션 서버 실행

# 테스트
npm run test             # 단위 테스트
npm run test:api         # API 연결 테스트
npm run test:e2e         # E2E 테스트

# 코드 품질
npm run lint             # ESLint 실행
```

---

**준비 완료!** 🎉

이제 http://localhost:3000 에서 HEPHAITOS를 사용할 수 있습니다.
