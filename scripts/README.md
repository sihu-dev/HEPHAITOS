# 🔧 리포지토리 기능 자동 활성화 도구

모든 sihu-dev 리포지토리의 기능을 한 번에 활성화하는 자동화 도구입니다.

## 📋 활성화되는 기능

- ✅ **Issues** - 이슈 트래킹
- ✅ **Projects** - 프로젝트 관리 보드
- ✅ **Wiki** - 문서화
- ✅ **Discussions** - 커뮤니티 토론
- ✅ **All Merge Types** - Merge commit, Squash, Rebase
- ✅ **Auto-merge** - 자동 머지
- ✅ **Delete branch on merge** - 머지 후 브랜치 자동 삭제
- ✅ **Update branch** - 머지 전 브랜치 업데이트 제안

## 🎯 대상 리포지토리

- `forge-labs`
- `bidflow`
- `HEPHAITOS`
- `dryon`

## 🚀 사용 방법

### 방법 1: 웹에서 직접 설정 (가장 빠름)

각 리포지토리 설정 페이지에서 수동으로 활성화:

1. **forge-labs**: https://github.com/sihu-dev/forge-labs/settings
2. **bidflow**: https://github.com/sihu-dev/bidflow/settings
3. **HEPHAITOS**: https://github.com/sihu-dev/HEPHAITOS/settings
4. **dryon**: https://github.com/sihu-dev/dryon/settings

**Features 섹션:**
- [x] Issues
- [x] Projects
- [x] Preserve this repository
- [x] Discussions
- [x] Wiki

**Pull Requests 섹션:**
- [x] Allow merge commits
- [x] Allow squash merging
- [x] Allow rebase merging
- [x] Always suggest updating pull request branches
- [x] Allow auto-merge
- [x] Automatically delete head branches

---

### 방법 2: GitHub Actions 자동화 (권장)

#### 2-1. HEPHAITOS에 이미 배포됨

HEPHAITOS 리포지토리에는 이미 워크플로우가 배포되었습니다:

```bash
# 현재 브랜치를 main에 머지하면 자동 실행됩니다
```

워크플로우 위치: `.github/workflows/enable-repo-features.yml`

#### 2-2. 다른 리포지토리에 배포하기

각 리포지토리에 워크플로우를 수동으로 복사:

**단계:**

1. **워크플로우 파일 복사**

```bash
# forge-labs
cd /path/to/forge-labs
mkdir -p .github/workflows
cp /path/to/HEPHAITOS/.github/workflows/enable-repo-features.yml .github/workflows/enable-features.yml

# bidflow
cd /path/to/bidflow
mkdir -p .github/workflows
cp /path/to/HEPHAITOS/.github/workflows/enable-repo-features.yml .github/workflows/enable-features.yml

# dryon
cd /path/to/dryon
mkdir -p .github/workflows
cp /path/to/HEPHAITOS/.github/workflows/enable-repo-features.yml .github/workflows/enable-features.yml
```

2. **커밋 및 푸시**

```bash
git add .github/workflows/enable-features.yml
git commit -m "feat: add workflow to enable all repository features"
git push
```

3. **워크플로우 수동 실행**

각 리포지토리의 Actions 탭에서 "Enable Repository Features" 워크플로우를 수동 실행:

- https://github.com/sihu-dev/forge-labs/actions
- https://github.com/sihu-dev/bidflow/actions
- https://github.com/sihu-dev/HEPHAITOS/actions
- https://github.com/sihu-dev/dryon/actions

---

### 방법 3: 자동 배포 스크립트 (고급)

**요구사항:**
- GitHub Personal Access Token with `repo` scope
- Git CLI 설치

**실행:**

```bash
# 토큰 설정
export GITHUB_TOKEN="your_token_here"

# 스크립트 실행
./scripts/enable-all-repo-features.sh
```

**참고:** 현재 다른 리포지토리에 대한 접근 권한이 제한되어 있어 수동 방법을 권장합니다.

---

## 📁 파일 구조

```
HEPHAITOS/
├── .github/
│   └── workflows/
│       └── enable-repo-features.yml    # GitHub Actions 워크플로우
└── scripts/
    ├── enable-all-repo-features.sh     # 자동 배포 스크립트
    └── README.md                        # 이 파일
```

## 🔍 워크플로우 동작 원리

1. 워크플로우가 트리거됨 (수동 실행 또는 main 브랜치 push)
2. GitHub Actions의 `GITHUB_TOKEN` 사용하여 GitHub API 호출
3. 리포지토리 설정 업데이트
4. 완료 상태를 GitHub Actions Summary에 표시

## ⚠️ 주의사항

- `GITHUB_TOKEN`은 기본적으로 현재 리포지토리에만 접근 권한이 있습니다
- 다른 리포지토리를 수정하려면 Personal Access Token이 필요합니다
- 워크플로우는 각 리포지토리에 개별적으로 배포되어야 합니다

## 🐛 문제 해결

### 403 에러 발생 시
- Personal Access Token의 권한 확인
- 토큰이 `repo` scope을 가지고 있는지 확인

### 워크플로우가 실행되지 않을 때
- Actions 탭에서 워크플로우가 활성화되어 있는지 확인
- 리포지토리 설정에서 GitHub Actions가 허용되어 있는지 확인

---

**작성일:** 2025-12-22
**작성자:** Claude Code
