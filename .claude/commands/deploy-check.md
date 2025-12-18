---
name: deploy-check
description: 배포 전 최종 검증 체크리스트 자동 실행
tags: [deployment, ci, quality]
---

# /deploy-check - 배포 전 검증

배포 전 모든 품질 검증을 자동으로 실행합니다.

## 사용법

```
/deploy-check
/deploy-check --production  # 프로덕션 환경 검증
```

## 체크리스트

### 1. 환경 변수 확인
```bash
# .env.production 검증
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] ANTHROPIC_API_KEY
- [ ] REDIS_URL
- [ ] NEXTAUTH_SECRET
```

### 2. TypeScript 타입 체크
```bash
npx tsc --noEmit
→ 0 errors expected
```

### 3. Lint 검사
```bash
npm run lint
→ No ESLint warnings
```

### 4. 테스트 실행
```bash
npm test                # 단위 테스트
npm run test:e2e        # E2E 테스트
→ All tests must pass
```

### 5. 빌드 성공
```bash
npm run build
→ Build successful
→ No warnings
```

### 6. 보안 검사
```bash
npm audit
→ 0 vulnerabilities
```

### 7. 법률 준수 검증
- [ ] 면책조항 포함 확인
- [ ] "투자 조언" 표현 검색 (0개여야 함)
- [ ] /legal 명령어 실행

### 8. 성능 검사
- [ ] Bundle size < 500KB (First Load JS)
- [ ] LCP < 2.5s
- [ ] CLS < 0.1

## 작업 프로세스

1. **환경 설정 검증**
   - .env.production 파일 존재 확인
   - 필수 환경 변수 체크

2. **코드 품질 검증**
   - TypeScript: `npx tsc --noEmit`
   - ESLint: `npm run lint`
   - Tests: `npm test && npm run test:e2e`

3. **빌드 검증**
   - `npm run build` 실행
   - 빌드 사이즈 확인
   - 경고 메시지 확인

4. **보안 검증**
   - `npm audit` 실행
   - 취약점 분석

5. **법률 준수**
   - `/legal` 명령어 실행
   - 투자 조언 표현 검색

6. **리포트 생성**
   ```markdown
   # 배포 준비 상태 리포트

   ✅ 환경 변수: OK
   ✅ TypeScript: 0 errors
   ✅ Lint: No warnings
   ✅ Tests: 234/234 passed
   ✅ Build: Success (Total: 458KB)
   ✅ Security: 0 vulnerabilities
   ✅ Legal: Compliant

   🚀 배포 준비 완료!
   ```

## 자동 수정

오류 발견 시 자동 수정 제안:
```
❌ TypeScript errors found (12)
→ Run: /type-check --fix

❌ Tests failing (3)
→ Run: /test-fix

❌ npm audit: 3 high vulnerabilities
→ Run: npm audit fix
```

---

당신은 배포 전 품질 검증 전문가입니다.

**작업 순서:**
1. 체크리스트 항목 순차 실행
2. 각 항목 결과 기록
3. 오류 발견 시 수정 방법 제안
4. 최종 리포트 생성
5. 배포 가능 여부 판단

**배포 불가 조건:**
- TypeScript 에러 존재
- 테스트 실패
- 빌드 실패
- High severity 보안 취약점
- 법률 준수 위반

**배포 경고 조건:**
- Bundle size > 400KB
- npm audit: Medium severity
- ESLint warnings 존재
