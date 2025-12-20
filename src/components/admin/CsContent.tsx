'use client';

/**
 * Admin CS Dashboard
 * Loop 13: 환불 요청 실시간 모니터링 + 승인/거절
 */

import { useCallback, useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface RefundRequest {
  id: string;
  user_id: string;
  order_id: string;
  reason: string;
  credits_used: number;
  credits_total: number;
  usage_rate: number;
  refund_amount: number | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  admin_note: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
}

export function CsContent() {
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    
    const channel = supabase
      .channel('refund-requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'refund_requests' },
        () => loadRequests()
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      
      const { data } = await supabase
        .from('refund_requests')
        .select('*')
        .order('created_at', { ascending: false });
      setRequests(data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = useCallback(async (id: string, action: 'approved' | 'rejected') => {
    setProcessing(id);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      // Supabase 타입 추론 우회 (refund_requests 테이블 타입 명시)
      type RefundUpdate = { status: 'pending' | 'approved' | 'rejected' | 'completed' };
      const client = supabase as unknown as {
        from: (table: string) => {
          update: (data: RefundUpdate) => { eq: (col: string, val: string) => Promise<unknown> }
        }
      };
      await client.from('refund_requests').update({ status: action }).eq('id', id);
      await loadRequests();
    } finally {
      setProcessing(null);
    }
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">환불 요청 관리</h1>
      {loading ? (
        <div className="text-zinc-400">로딩 중...</div>
      ) : requests.length === 0 ? (
        <div className="text-zinc-400">환불 요청이 없습니다</div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-medium">주문 ID: {req.order_id}</p>
                  <p className="text-sm text-zinc-400">{req.reason}</p>
                  <p className="text-xs text-zinc-500">
                    크레딧: {req.credits_used}/{req.credits_total} 사용 ({(req.usage_rate * 100).toFixed(1)}%)
                  </p>
                  <p className="text-sm text-zinc-500">
                    {formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: ko })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono">
                    ₩{(req.refund_amount ?? 0).toLocaleString()}
                  </span>
                  {req.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAction(req.id, 'approved')}
                        disabled={processing === req.id}
                        className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-500 disabled:opacity-50"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => handleAction(req.id, 'rejected')}
                        disabled={processing === req.id}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-500 disabled:opacity-50"
                      >
                        거절
                      </button>
                    </>
                  )}
                  {req.status !== 'pending' && (
                    <span className={`px-2 py-1 rounded text-xs ${
                      req.status === 'approved' || req.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {req.status === 'approved' ? '승인됨' : req.status === 'completed' ? '완료됨' : '거절됨'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
