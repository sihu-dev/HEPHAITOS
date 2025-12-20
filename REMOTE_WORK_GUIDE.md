# HEPHAITOS 모바일 원격 작업 가이드

> 어디서든 HEPHAITOS 개발하기
> 마지막 업데이트: 2025-12-21

---

## 방법 1: Claude 공식 웹/모바일 (권장)

### iOS 앱에서 Claude Code 사용

1. **Claude iOS 앱** 최신 버전 설치
2. 앱 설정 → Claude Code 활성화
3. GitHub 레포 연결:
   ```
   https://github.com/sihu-dev/HEPHAITOS
   ```
4. 작업 요청 예시:
   ```
   HEPHAITOS 레포에서 src/components/ui/Button.tsx 수정해줘
   ```

### 웹에서 Claude Code 사용

1. https://claude.com 접속
2. Claude Code 탭 선택
3. GitHub 연동 후 레포 선택
4. 클라우드에서 자동 실행

**필요 플랜**: Pro / Max / Team / Enterprise

---

## 방법 2: Happy Coder (오픈소스)

### 설치 (이미 완료됨)

```bash
npm install -g happy-coder
```

### 초기 설정 (PC에서 실행)

```bash
# 1. 인증
happy auth login

# 2. HEPHAITOS 디렉토리에서 데몬 시작
cd /home/sihu2129/HEPHAITOS
happy daemon start

# 3. 모바일 앱 연결
# QR 코드가 표시됨 → 모바일에서 스캔
```

### 모바일 앱 설치

- **iOS**: App Store → "Happy Coder" 검색
- **Android**: Google Play → "Happy Coder" 검색

### 사용법

모바일 앱에서:
```
"src/app/page.tsx 열어줘"
"Button 컴포넌트에 loading 상태 추가해줘"
"git commit -m 'feat: add loading state'"
```

음성 명령도 지원!

---

## 방법 3: SSH 터널링 (고급)

### Tailscale 설정

```bash
# 1. Tailscale 설치
curl -fsSL https://tailscale.com/install.sh | sh

# 2. 로그인
sudo tailscale up

# 3. IP 확인
tailscale ip -4
# 예: 100.x.x.x
```

### 모바일에서 SSH 접속

1. **Termius** 또는 **Blink Shell** 앱 설치
2. 새 호스트 추가:
   - Host: `100.x.x.x` (Tailscale IP)
   - User: `sihu2129`
   - Auth: SSH 키 또는 비밀번호
3. 접속 후:
   ```bash
   cd /home/sihu2129/HEPHAITOS
   claude
   ```

---

## 빠른 시작 스크립트

### PC에서 원격 작업 준비

```bash
# 원격 작업 모드 시작
cd /home/sihu2129/HEPHAITOS
./scripts/start-remote.sh
```

### 스크립트 내용 (scripts/start-remote.sh)

```bash
#!/bin/bash
echo "🚀 HEPHAITOS 원격 작업 모드 시작..."

# 1. Git 상태 확인
git status --short

# 2. Happy Coder 데몬 시작
happy daemon start &

# 3. 개발 서버 시작 (백그라운드)
npm run dev &

echo "✅ 준비 완료! 모바일에서 연결하세요."
echo "📱 Happy Coder 앱에서 QR 스캔"
```

---

## 권장 워크플로우

### 이동 중 작업

```
1. 모바일에서 Claude Code 또는 Happy 앱 열기
2. "HEPHAITOS에서 [작업] 해줘"
3. 결과 확인 및 승인
4. 자동 커밋/푸시
```

### 작업 예시

| 상황 | 명령어 |
|------|--------|
| 버그 확인 | "에러 로그 보여줘" |
| 빠른 수정 | "Button hover 색상 #5E6AD2로 변경" |
| PR 생성 | "현재 변경사항으로 PR 만들어줘" |
| 배포 확인 | "빌드 상태 확인해줘" |

---

## 보안 주의사항

1. **공용 Wi-Fi 사용 시** VPN 권장
2. **민감한 작업** (API 키 수정 등)은 PC에서
3. **Happy Coder** 연결은 E2E 암호화됨

---

## 트러블슈팅

### Happy Coder 연결 안됨

```bash
# 데몬 재시작
happy daemon stop
happy daemon start

# 진단
happy doctor
```

### Claude Code 웹에서 레포 안보임

1. GitHub 연동 재확인
2. 레포가 Public인지 확인
3. claude.com 설정에서 권한 재부여

---

## 연결 정보

| 항목 | 값 |
|------|-----|
| GitHub 레포 | https://github.com/sihu-dev/HEPHAITOS |
| 프로젝트 경로 | /home/sihu2129/HEPHAITOS |
| 개발 서버 | http://localhost:3000 |

---

*이 가이드는 HEPHAITOS 원격 작업용입니다.*
