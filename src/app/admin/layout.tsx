/**
 * Admin Layout
 * Loop 13: Admin 섹션 레이아웃 + 인증 체크
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login?redirect=/admin/cs');
  }

  // Admin 권한 확인 (실제 구현 시 user metadata 또는 별도 테이블 확인)
  // 임시: 이메일 도메인 체크 또는 role 확인
  const isAdmin = checkAdminRole(user);

  if (!isAdmin) {
    redirect('/dashboard?error=unauthorized');
  }

  return (
    <div className="min-h-screen bg-[#0D0D0F]">
      {/* Admin Navigation */}
      <nav className="border-b border-white/10 bg-white/3 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-white">HEPHAITOS Admin</h1>
              <div className="flex gap-4">
                <AdminNavLink href="/admin/cs" label="환불 관리" />
                <AdminNavLink href="/admin/users" label="사용자 관리" />
                <AdminNavLink href="/admin/strategies" label="전략 관리" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-white/60">{user.email}</span>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  로그아웃
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main>{children}</main>
    </div>
  );
}

function AdminNavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="text-sm text-white/60 hover:text-white transition-colors font-medium"
    >
      {label}
    </a>
  );
}

/**
 * Admin 권한 확인
 * TODO: 실제 구현 시 Supabase user metadata 또는 별도 admin_users 테이블 확인
 */
function checkAdminRole(user: User): boolean {
  // 방법 1: 이메일 화이트리스트
  const adminEmails = [
    'admin@hephaitos.io',
    // 실제 관리자 이메일 추가
  ];

  if (adminEmails.includes(user.email)) {
    return true;
  }

  // 방법 2: user metadata의 role 확인
  if (user.user_metadata?.role === 'admin') {
    return true;
  }

  // 방법 3: JWT의 role claim 확인
  // Supabase에서 custom claims 설정 필요
  // if (user.app_metadata?.role === 'admin') {
  //   return true;
  // }

  return false;
}
