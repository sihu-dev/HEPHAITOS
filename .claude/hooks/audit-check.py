#!/usr/bin/env python3
"""
HEPHAITOS Audit Check Hook
Claude 4.5 Opus 기반 자동 검수 훅

실행 시점: PostToolUse (Edit, Write 후)
목적: 코드 품질, 디자인 시스템, 법률 준수 자동 검사
"""

import os
import sys
import re
import json
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from datetime import datetime

# ============================================
# 검사 패턴 정의
# ============================================

# 코드 품질 검사
CODE_QUALITY_PATTERNS = {
    'any_type': {
        'pattern': r'\bany\b',
        'severity': 'high',
        'message': 'any 타입 사용 금지 - unknown 또는 구체적 타입 사용',
        'extensions': ['.ts', '.tsx'],
    },
    'type_assertion': {
        'pattern': r'as\s+any\b',
        'severity': 'high',
        'message': 'as any 타입 단언 금지',
        'extensions': ['.ts', '.tsx'],
    },
    'console_log': {
        'pattern': r'console\.(log|debug|info)\s*\(',
        'severity': 'low',
        'message': 'console.log 발견 - 프로덕션 코드에서 제거 권장',
        'extensions': ['.ts', '.tsx', '.js', '.jsx'],
    },
}

# 디자인 시스템 검사
DESIGN_SYSTEM_PATTERNS = {
    'hardcoded_color': {
        'pattern': r'(?:color|background|border):\s*[\'"]?#[0-9a-fA-F]{3,8}\b',
        'severity': 'medium',
        'message': '하드코딩 컬러값 발견 - Tailwind 토큰 사용',
        'extensions': ['.tsx', '.jsx', '.css'],
    },
    'inline_style_color': {
        'pattern': r'style\s*=\s*\{\s*\{[^}]*(?:color|background)[^}]*\}\s*\}',
        'severity': 'medium',
        'message': '인라인 스타일 컬러 발견 - className 사용 권장',
        'extensions': ['.tsx', '.jsx'],
    },
}

# 법률 준수 검사 (Critical)
LEGAL_PATTERNS = {
    'profit_guarantee': {
        'pattern': r'수익\s*보장|확실한\s*수익|guaranteed\s*profit',
        'severity': 'critical',
        'message': '수익 보장 표현 금지 - 법적 문제 발생 가능',
        'extensions': ['.tsx', '.jsx', '.ts', '.js', '.md'],
    },
    'investment_advice': {
        'pattern': r'투자\s*권유|~하세요|~해야\s*합니다|must\s+invest|should\s+buy',
        'severity': 'critical',
        'message': '투자 조언/권유 표현 금지',
        'extensions': ['.tsx', '.jsx', '.ts', '.js', '.md'],
    },
    'recommendation': {
        'pattern': r'추천\s*종목|best\s*stock|hot\s*pick',
        'severity': 'critical',
        'message': '종목 추천 표현 금지',
        'extensions': ['.tsx', '.jsx', '.ts', '.js', '.md'],
    },
}

# 보안 검사 (Critical)
SECURITY_PATTERNS = {
    'hardcoded_secret': {
        'pattern': r'(?:api[_-]?key|secret|password|token)\s*[:=]\s*[\'"`][^\'"]+[\'"`]',
        'severity': 'critical',
        'message': '하드코딩된 비밀값 발견 - 환경변수 사용',
        'extensions': ['.ts', '.tsx', '.js', '.jsx'],
    },
    'eval_usage': {
        'pattern': r'\beval\s*\(',
        'severity': 'critical',
        'message': 'eval 사용 금지 - 보안 취약점',
        'extensions': ['.ts', '.tsx', '.js', '.jsx'],
    },
    'dangerous_html': {
        'pattern': r'dangerouslySetInnerHTML|innerHTML\s*=',
        'severity': 'high',
        'message': 'XSS 취약점 가능성 - sanitize 필수',
        'extensions': ['.tsx', '.jsx'],
    },
}

# ============================================
# 검사 함수
# ============================================

def get_file_extension(file_path: str) -> str:
    """파일 확장자 반환"""
    return Path(file_path).suffix.lower()

def check_patterns(content: str, patterns: Dict, file_ext: str) -> List[Dict]:
    """패턴 검사 수행"""
    issues = []

    for name, pattern_info in patterns.items():
        if file_ext not in pattern_info['extensions']:
            continue

        matches = re.finditer(pattern_info['pattern'], content, re.IGNORECASE)
        for match in matches:
            line_num = content[:match.start()].count('\n') + 1
            issues.append({
                'name': name,
                'severity': pattern_info['severity'],
                'message': pattern_info['message'],
                'line': line_num,
                'match': match.group()[:50],  # 처음 50자만
            })

    return issues

def run_audit(file_path: str) -> Tuple[bool, List[Dict]]:
    """파일 검수 실행"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return True, []  # 읽기 실패 시 통과

    file_ext = get_file_extension(file_path)
    all_issues = []

    # 모든 패턴 검사
    all_issues.extend(check_patterns(content, CODE_QUALITY_PATTERNS, file_ext))
    all_issues.extend(check_patterns(content, DESIGN_SYSTEM_PATTERNS, file_ext))
    all_issues.extend(check_patterns(content, LEGAL_PATTERNS, file_ext))
    all_issues.extend(check_patterns(content, SECURITY_PATTERNS, file_ext))

    # Critical 이슈가 있으면 실패
    has_critical = any(issue['severity'] == 'critical' for issue in all_issues)

    return not has_critical, all_issues

def format_report(file_path: str, issues: List[Dict]) -> str:
    """검수 리포트 포맷팅"""
    if not issues:
        return f"✓ {file_path}: 이슈 없음"

    report_lines = [
        f"\n{'='*60}",
        f"AUDIT REPORT: {file_path}",
        f"{'='*60}",
    ]

    # 심각도별 분류
    critical = [i for i in issues if i['severity'] == 'critical']
    high = [i for i in issues if i['severity'] == 'high']
    medium = [i for i in issues if i['severity'] == 'medium']
    low = [i for i in issues if i['severity'] == 'low']

    if critical:
        report_lines.append("\n🚨 CRITICAL (즉시 수정 필요):")
        for issue in critical:
            report_lines.append(f"  Line {issue['line']}: {issue['message']}")

    if high:
        report_lines.append("\n⚠️  HIGH (배포 전 수정 필요):")
        for issue in high:
            report_lines.append(f"  Line {issue['line']}: {issue['message']}")

    if medium:
        report_lines.append("\n📋 MEDIUM (수정 권장):")
        for issue in medium:
            report_lines.append(f"  Line {issue['line']}: {issue['message']}")

    if low:
        report_lines.append("\n💡 LOW (개선 가능):")
        for issue in low:
            report_lines.append(f"  Line {issue['line']}: {issue['message']}")

    report_lines.append(f"\n총 이슈: {len(issues)}개 (Critical: {len(critical)}, High: {len(high)}, Medium: {len(medium)}, Low: {len(low)})")
    report_lines.append('='*60)

    return '\n'.join(report_lines)

# ============================================
# 메인 실행
# ============================================

def main():
    """메인 함수"""
    file_path = os.environ.get('CLAUDE_FILE_PATH', '')

    if not file_path or not os.path.exists(file_path):
        sys.exit(0)  # 파일 없으면 통과

    # 검수 대상 확장자
    target_extensions = ['.ts', '.tsx', '.js', '.jsx', '.css', '.md']
    file_ext = get_file_extension(file_path)

    if file_ext not in target_extensions:
        sys.exit(0)  # 대상 아니면 통과

    # 검수 실행
    passed, issues = run_audit(file_path)

    if issues:
        report = format_report(file_path, issues)
        print(report, file=sys.stderr)

    # Critical 이슈가 있으면 경고 (차단은 안 함)
    if not passed:
        print("\n⚠️  Critical 이슈 발견! /audit 명령어로 상세 검수를 실행하세요.", file=sys.stderr)

    # 항상 통과 (경고만 표시)
    sys.exit(0)

if __name__ == '__main__':
    main()
