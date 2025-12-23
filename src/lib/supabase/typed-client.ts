/**
 * Typed Supabase Client Wrapper
 *
 * Eliminates `as any` type assertions by providing strongly typed wrappers
 * for common Supabase operations.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Typed query builder for strategies table
 */
export function createTypedStrategiesQuery(supabase: SupabaseClient<Database>) {
  return {
    select(columns = '*') {
      return supabase.from('strategies').select(columns);
    },

    selectById(id: string) {
      return supabase
        .from('strategies')
        .select('*')
        .eq('id', id)
        .single();
    },

    selectByUserId(userId: string) {
      return supabase
        .from('strategies')
        .select('*')
        .eq('user_id', userId);
    },

    insert(strategy: Database['public']['Tables']['strategies']['Insert']) {
      return supabase
        .from('strategies')
        .insert(strategy)
        .select()
        .single();
    },

    update(id: string, updates: Database['public']['Tables']['strategies']['Update']) {
      return supabase
        .from('strategies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    },

    delete(id: string) {
      return supabase
        .from('strategies')
        .delete()
        .eq('id', id);
    },
  };
}

/**
 * Typed RPC caller
 */
export function createTypedRPC(supabase: SupabaseClient<Database>) {
  return {
    async getStrategyPerformance(strategyId: string) {
      return supabase.rpc('get_strategy_performance', {
        p_strategy_id: strategyId,
      }).single();
    },

    async checkRefundEligibility(userId: string) {
      return supabase.rpc('check_refund_eligibility', {
        p_user_id: userId,
      });
    },

    async createRefundRequest(params: {
      userId: string;
      paymentId: string;
      amount: number;
      reason?: string;
    }) {
      return supabase.rpc('create_refund_request', {
        p_user_id: params.userId,
        p_payment_id: params.paymentId,
        p_amount: params.amount,
        p_reason: params.reason || null,
      });
    },

    async getUserRefundHistory(userId: string) {
      return supabase.rpc('get_user_refund_history', {
        p_user_id: userId,
      });
    },

    async grantCreditsForPaidOrder(params: {
      orderId: string;
      paymentKey: string;
      paidAmount: number;
      raw: unknown;
    }) {
      return supabase.rpc('grant_credits_for_paid_order', {
        p_order_id: params.orderId,
        p_payment_key: params.paymentKey,
        p_paid_amount: params.paidAmount,
        p_raw: params.raw,
      });
    },

    async scheduleWebhookRetry(eventId: string, error: string) {
      return supabase.rpc('schedule_webhook_retry', {
        p_event_id: eventId,
        p_error: error,
      });
    },

    async getPendingWebhookRetries(limit: number) {
      return supabase.rpc('get_pending_webhook_retries', {
        p_limit: limit,
      });
    },

    async createBacktestJob(params: {
      userId: string;
      strategyId: string;
      jobId: string;
      timeframe: string;
      startDate: string;
      endDate: string;
      symbol: string;
    }) {
      return supabase.rpc('create_backtest_job', {
        p_user_id: params.userId,
        p_strategy_id: params.strategyId,
        p_job_id: params.jobId,
        p_timeframe: params.timeframe,
        p_start_date: params.startDate,
        p_end_date: params.endDate,
        p_symbol: params.symbol,
      });
    },
  };
}

/**
 * Create a fully typed Supabase client wrapper
 */
export function createTypedSupabaseClient(supabase: SupabaseClient<Database>) {
  return {
    strategies: createTypedStrategiesQuery(supabase),
    rpc: createTypedRPC(supabase),

    // Auth helpers
    async getUser() {
      return supabase.auth.getUser();
    },

    // Direct access for advanced queries
    raw: supabase,
  };
}

export type TypedSupabaseClient = ReturnType<typeof createTypedSupabaseClient>;
