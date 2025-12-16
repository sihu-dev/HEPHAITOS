# HEPHAITOS API 키 자동 설정 스크립트
# 작성일: 2025-12-16

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  HEPHAITOS API 키 설정 도우미" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$envFile = Join-Path $PSScriptRoot "..\env.local"

# .env.local 파일 존재 확인
if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env.local 파일을 찾을 수 없습니다." -ForegroundColor Red
    Write-Host "   경로: $envFile" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ .env.local 파일 확인 완료" -ForegroundColor Green
Write-Host ""

# 함수: API 키 입력 받기
function Get-ApiKey {
    param (
        [string]$ServiceName,
        [string]$KeyName,
        [string]$Example,
        [bool]$Optional = $false
    )

    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "🔑 $ServiceName" -ForegroundColor Yellow
    if ($Optional) {
        Write-Host "   (선택사항 - Enter로 건너뛰기)" -ForegroundColor DarkGray
    }
    Write-Host "   예시: $Example" -ForegroundColor DarkGray
    Write-Host ""

    $key = Read-Host "   $KeyName"

    if ([string]::IsNullOrWhiteSpace($key)) {
        if ($Optional) {
            Write-Host "   ⏭️  건너뛰었습니다." -ForegroundColor DarkGray
            return $null
        } else {
            Write-Host "   ❌ 필수 항목입니다. 다시 입력해주세요." -ForegroundColor Red
            return Get-ApiKey -ServiceName $ServiceName -KeyName $KeyName -Example $Example -Optional $Optional
        }
    }

    Write-Host "   ✅ 입력 완료" -ForegroundColor Green
    return $key
}

# 현재 .env.local 파일 백업
$backupFile = "$envFile.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item $envFile $backupFile
Write-Host "📦 백업 생성: $backupFile" -ForegroundColor Cyan
Write-Host ""

# API 키 수집
$keys = @{}

# 1. Anthropic (필수)
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  1/4: Claude AI (Anthropic) - 필수" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "발급: https://console.anthropic.com/" -ForegroundColor Blue
Write-Host ""
$keys['ANTHROPIC_API_KEY'] = Get-ApiKey -ServiceName "Claude AI" -KeyName "ANTHROPIC_API_KEY" -Example "sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx" -Optional $false

# 2. KIS (선택)
Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  2/4: 한국투자증권 (KIS) - 선택" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "발급: https://apiportal.koreainvestment.com/" -ForegroundColor Blue
Write-Host ""

$setupKis = Read-Host "KIS API를 설정하시겠습니까? (y/N)"
if ($setupKis -eq 'y' -or $setupKis -eq 'Y') {
    $keys['KIS_APP_KEY'] = Get-ApiKey -ServiceName "KIS APP KEY" -KeyName "KIS_APP_KEY" -Example "PSxxxxxxxxxxxxxxxxxxxx" -Optional $true
    $keys['KIS_APP_SECRET'] = Get-ApiKey -ServiceName "KIS APP SECRET" -KeyName "KIS_APP_SECRET" -Example "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" -Optional $true
    $keys['KIS_ACCOUNT_NUMBER'] = Get-ApiKey -ServiceName "KIS 계좌번호" -KeyName "KIS_ACCOUNT_NUMBER" -Example "12345678-01" -Optional $true
}

# 3. Polygon.io (선택)
Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  3/4: Polygon.io - 선택" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "발급: https://polygon.io/" -ForegroundColor Blue
Write-Host ""

$setupPolygon = Read-Host "Polygon.io API를 설정하시겠습니까? (y/N)"
if ($setupPolygon -eq 'y' -or $setupPolygon -eq 'Y') {
    $keys['POLYGON_API_KEY'] = Get-ApiKey -ServiceName "Polygon.io" -KeyName "POLYGON_API_KEY" -Example "xxxxxxxxxxxxxxxxxxxxxxxx" -Optional $true
}

# 4. 토스페이먼츠 (선택)
Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  4/4: 토스페이먼츠 - 선택" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "발급: https://developers.tosspayments.com/" -ForegroundColor Blue
Write-Host ""

$setupToss = Read-Host "토스페이먼츠 API를 설정하시겠습니까? (y/N)"
if ($setupToss -eq 'y' -or $setupToss -eq 'Y') {
    $keys['TOSS_CLIENT_KEY'] = Get-ApiKey -ServiceName "토스 Client Key" -KeyName "TOSS_CLIENT_KEY" -Example "test_ck_xxxxxxxxxxxxxxxxxxxxxxxxxx" -Optional $true
    $keys['TOSS_SECRET_KEY'] = Get-ApiKey -ServiceName "토스 Secret Key" -KeyName "TOSS_SECRET_KEY" -Example "test_sk_xxxxxxxxxxxxxxxxxxxxxxxxxx" -Optional $true
}

# .env.local 파일 업데이트
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📝 .env.local 파일 업데이트 중..." -ForegroundColor Yellow

$content = Get-Content $envFile -Raw

foreach ($key in $keys.Keys) {
    $value = $keys[$key]
    if ($value) {
        # 기존 값이 있으면 교체, 없으면 추가
        if ($content -match "$key=.*") {
            $content = $content -replace "$key=.*", "$key=$value"
        } else {
            $content += "`n$key=$value"
        }
    }
}

# 파일 저장
Set-Content -Path $envFile -Value $content -NoNewline

Write-Host "✅ .env.local 파일 업데이트 완료" -ForegroundColor Green
Write-Host ""

# 요약 출력
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 설정 완료 요약" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

foreach ($key in $keys.Keys) {
    if ($keys[$key]) {
        $masked = $keys[$key].Substring(0, [Math]::Min(10, $keys[$key].Length)) + "..."
        Write-Host "✅ $key = $masked" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🎉 API 키 설정 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Yellow
Write-Host "  1. npm run dev          # 개발 서버 실행" -ForegroundColor White
Write-Host "  2. npm run test:api     # API 연결 테스트 (선택)" -ForegroundColor White
Write-Host ""
Write-Host "백업 파일: $backupFile" -ForegroundColor DarkGray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
