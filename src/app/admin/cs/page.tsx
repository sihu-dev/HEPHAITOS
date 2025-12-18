/**
 * Admin CS Dashboard
 * Loop 13: 환불 요청 실시간 모니터링 + 승인/거절
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface RefundRequest {
  id: string;
  user_id: string;
  user_email: string;
  payment_id: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';
  created_at: string;
  processed_at?: string;
  admin_note?: string;
}

interface RefundStats {
  total_requests: number;
  pending_count: number;
  approved_count: number;
  completed_count: number;
  rejected_count: number;
  total_refunded_amount: number;
}

export default function AdminCSPage() {
  const [pendingRequests, setPendingRequests] = useState<RefundRequest[]>([]);
  const [allRequests, setAllRequests] = useState<RefundRequest[]>([]);
  const [stats, setStats] = useState<RefundStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

  const supabase = getSupabaseBrowserClient();

  // 초기 데이터 가져오기
  const fetchInitialData = useCallback(async () => {
    if (!supabase) return;

    try {
      // 대기 중인 요청 - Use type assertion for custom RPC
      const { data: pending } = await (supabase as unknown as { rpc: (fn: string, params: Record<string, unknown>) => Promise<{ data: RefundRequest[] | null }> }).rpc('get_pending_refunds', {
        p_limit: 50,
      });

      if (pending) {
        setPendingRequests(pending);
      }

      // 전체 이력
      const { data: all } = await supabase
        .from('refund_requests')
        .select(
          `
          *,
          auth.users(email)
        `
        )
        .order('created_at', { ascending: false })
        .limit(100);

      if (all) {
        setAllRequests(
          (all as unknown as Array<RefundRequest & { users?: { email: string } }>).map((r) => ({
            ...r,
            user_email: r.users?.email || 'N/A',
          }))
        );
      }

      // 통계 - Use type assertion for custom RPC
      const { data: statsData } = await (supabase as unknown as { rpc: (fn: string) => Promise<{ data: RefundStats[] | null }> }).rpc('get_refund_stats');
      if (statsData && statsData.length > 0) {
        setStats(statsData[0]);
      }
    } catch (error) {
      console.error('[Admin CS] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Realtime 구독
  const setupRealtimeSubscription = useCallback(() => {
    if (!supabase) return () => {};

    const channel = supabase
      .channel('admin-refund-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'refund_requests',
        },
        (payload) => {
          console.log('[Admin CS] Realtime update:', payload);
          fetchInitialData(); // 전체 데이터 새로고침
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchInitialData]);

  // 초기 데이터 로드
  useEffect(() => {
    if (!supabase) return;
    fetchInitialData();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [supabase, fetchInitialData, setupRealtimeSubscription]);

  // 환불 승인
  const handleApprove = async (requestId: string) => {
    if (!supabase) return;
    if (!confirm('환불 요청을 승인하시겠습니까?')) return;

    setProcessingId(requestId);

    try {
      // Use type assertion for custom RPC
      const { error } = await (supabase as unknown as { rpc: (fn: string, params: Record<string, unknown>) => Promise<{ error: Error | null }> }).rpc('update_refund_status', {
        p_request_id: requestId,
        p_status: 'approved',
        p_admin_note: '관리자 승인',
      });

      if (error) throw error;

      // Edge Function 트리거 (자동 환불 처리)
      await supabase.functions.invoke('auto-refund-handler', {
        body: { refund_request_id: requestId },
      });

      alert('환불이 승인되었습니다. 자동 처리 중입니다.');
      await fetchInitialData();
    } catch (error) {
      console.error('[Admin CS] Approve error:', error);
      alert('승인 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  // 환불 거절
  const handleReject = async (requestId: string) => {
    if (!supabase) return;
    const reason = prompt('거절 사유를 입력하세요:');
    if (!reason) return;

    setProcessingId(requestId);

    try {
      // Use type assertion for custom RPC
      const { error } = await (supabase as unknown as { rpc: (fn: string, params: Record<string, unknown>) => Promise<{ error: Error | null }> }).rpc('update_refund_status', {
        p_request_id: requestId,
        p_status: 'rejected',
        p_admin_note: reason,
      });

      if (error) throw error;

      alert('환불 요청이 거절되었습니다.');
      await fetchInitialData();
    } catch (error) {
      console.error('[Admin CS] Reject error:', error);
      alert('거절 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  // 상태 뱃지
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      approved: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
      failed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };

    const labels: Record<string, string> = {
      pending: '대기',
      approved: '승인됨',
      completed: '완료',
      rejected: '거절됨',
      failed: '실패',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          colors[status] || colors.pending
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0F] flex items-center justify-center">
        <div className="text-white/60">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0F] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">환불 관리 대시보드</h1>
          <p className="text-white/60">실시간 환불 요청 모니터링 및 처리</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <StatCard label="전체 요청" value={stats.total_requests} />
            <StatCard label="대기 중" value={stats.pending_count} color="yellow" />
            <StatCard label="승인됨" value={stats.approved_count} color="blue" />
            <StatCard label="완료" value={stats.completed_count} color="green" />
            <StatCard label="거절됨" value={stats.rejected_count} color="red" />
            <StatCard
              label="총 환불액"
              value={`₩${(stats.total_refunded_amount / 10000).toFixed(1)}만`}
              color="purple"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'pending'
                ? 'bg-[#5E6AD2] text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            대기 중 ({pendingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-[#5E6AD2] text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            전체 이력 ({allRequests.length})
          </button>
        </div>

        {/* Requests Table */}
        <div className="bg-white/3 backdrop-blur-xl border border-white/6 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    사유
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    요청 시간
                  </th>
                  {activeTab === 'pending' && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/60 uppercase tracking-wider">
                      액션
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(activeTab === 'pending' ? pendingRequests : allRequests).map((request) => (
                  <tr key={request.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{request.user_email}</div>
                      <div className="text-xs text-white/40 font-mono">
                        {request.user_id.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        ₩{request.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white/80 max-w-xs truncate">
                        {request.reason || '-'}
                      </div>
                      {request.admin_note && (
                        <div className="text-xs text-white/40 mt-1">
                          관리자: {request.admin_note}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                      {formatDistanceToNow(new Date(request.created_at), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </td>
                    {activeTab === 'pending' && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={processingId === request.id}
                          className="text-green-400 hover:text-green-300 mr-4 disabled:opacity-50"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={processingId === request.id}
                          className="text-red-400 hover:text-red-300 disabled:opacity-50"
                        >
                          거절
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(activeTab === 'pending' ? pendingRequests : allRequests).length === 0 && (
            <div className="text-center py-12 text-white/40">
              {activeTab === 'pending' ? '대기 중인 요청이 없습니다' : '환불 이력이 없습니다'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  color = 'white',
}: {
  label: string;
  value: number | string;
  color?: 'white' | 'yellow' | 'blue' | 'green' | 'red' | 'purple';
}) {
  const colors: Record<string, string> = {
    white: 'text-white',
    yellow: 'text-yellow-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
  };

  return (
    <div className="bg-white/3 backdrop-blur-xl border border-white/6 rounded-xl p-4">
      <div className="text-white/60 text-xs font-medium mb-1">{label}</div>
      <div className={`text-2xl font-bold ${colors[color]}`}>{value}</div>
    </div>
  );
}
