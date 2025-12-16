// ============================================
// Supabase Database Types
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Users (managed by Supabase Auth, extended with profile)
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          plan: 'free' | 'pro' | 'enterprise'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'pro' | 'enterprise'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'pro' | 'enterprise'
          updated_at?: string
        }
      }

      // Exchange Connections
      exchange_connections: {
        Row: {
          id: string
          user_id: string
          exchange_id: string
          api_key_encrypted: string
          secret_key_encrypted: string
          is_active: boolean
          permissions: string[]
          last_connected_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exchange_id: string
          api_key_encrypted: string
          secret_key_encrypted: string
          is_active?: boolean
          permissions?: string[]
          last_connected_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          exchange_id?: string
          api_key_encrypted?: string
          secret_key_encrypted?: string
          is_active?: boolean
          permissions?: string[]
          last_connected_at?: string | null
          updated_at?: string
        }
      }

      // Trading Strategies
      strategies: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          status: 'draft' | 'backtesting' | 'ready' | 'running' | 'paused' | 'stopped'
          config: Json
          graph: Json | null
          performance: Json | null
          prompt: string | null
          is_public: boolean
          copy_count: number
          original_strategy_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          status?: 'draft' | 'backtesting' | 'ready' | 'running' | 'paused' | 'stopped'
          config: Json
          graph?: Json | null
          performance?: Json | null
          prompt?: string | null
          is_public?: boolean
          copy_count?: number
          original_strategy_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          status?: 'draft' | 'backtesting' | 'ready' | 'running' | 'paused' | 'stopped'
          config?: Json
          graph?: Json | null
          performance?: Json | null
          prompt?: string | null
          is_public?: boolean
          copy_count?: number
          original_strategy_id?: string | null
          updated_at?: string
        }
      }

      // Trades
      trades: {
        Row: {
          id: string
          user_id: string
          strategy_id: string | null
          exchange_id: string
          symbol: string
          type: 'buy' | 'sell'
          status: 'pending' | 'filled' | 'partial' | 'cancelled' | 'rejected'
          price: number
          amount: number
          total: number
          fee: number | null
          pnl: number | null
          pnl_percent: number | null
          order_id: string | null
          executed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          strategy_id?: string | null
          exchange_id: string
          symbol: string
          type: 'buy' | 'sell'
          status?: 'pending' | 'filled' | 'partial' | 'cancelled' | 'rejected'
          price: number
          amount: number
          total: number
          fee?: number | null
          pnl?: number | null
          pnl_percent?: number | null
          order_id?: string | null
          executed_at?: string | null
          created_at?: string
        }
        Update: {
          status?: 'pending' | 'filled' | 'partial' | 'cancelled' | 'rejected'
          price?: number
          amount?: number
          total?: number
          fee?: number | null
          pnl?: number | null
          pnl_percent?: number | null
          order_id?: string | null
          executed_at?: string | null
        }
      }

      // Backtest Results
      backtest_results: {
        Row: {
          id: string
          user_id: string
          strategy_id: string
          config: Json
          performance: Json
          equity_curve: Json
          trades: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          strategy_id: string
          config: Json
          performance: Json
          equity_curve: Json
          trades: Json
          created_at?: string
        }
        Update: {
          config?: Json
          performance?: Json
          equity_curve?: Json
          trades?: Json
        }
      }

      // Notifications
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'signal' | 'trade' | 'alert' | 'system'
          title: string
          message: string
          read: boolean
          data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'signal' | 'trade' | 'alert' | 'system'
          title: string
          message: string
          read?: boolean
          data?: Json | null
          created_at?: string
        }
        Update: {
          read?: boolean
        }
      }

      // User Settings
      user_settings: {
        Row: {
          id: string
          user_id: string
          notification_trade_signals: boolean
          notification_trade_execution: boolean
          notification_email_digest: boolean
          notification_push: boolean
          default_exchange: string | null
          theme: 'dark' | 'light' | 'system'
          language: string
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          notification_trade_signals?: boolean
          notification_trade_execution?: boolean
          notification_email_digest?: boolean
          notification_push?: boolean
          default_exchange?: string | null
          theme?: 'dark' | 'light' | 'system'
          language?: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          notification_trade_signals?: boolean
          notification_trade_execution?: boolean
          notification_email_digest?: boolean
          notification_push?: boolean
          default_exchange?: string | null
          theme?: 'dark' | 'light' | 'system'
          language?: string
          timezone?: string
          updated_at?: string
        }
      }

      // Credit Wallets
      credit_wallets: {
        Row: {
          id: string
          user_id: string
          balance: number
          lifetime_purchased: number
          lifetime_spent: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          lifetime_purchased?: number
          lifetime_spent?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          balance?: number
          lifetime_purchased?: number
          lifetime_spent?: number
          updated_at?: string
        }
      }

      // Credit Transactions
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          type: 'purchase' | 'spend' | 'refund' | 'bonus' | 'referral' | 'backtest' | 'strategy_generate' | 'report_create' | 'coaching_session' | 'tutor_answer'
          amount: number
          balance_after: number | null
          feature: string | null
          description: string | null
          metadata: Json | null
          payment_order_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'purchase' | 'spend' | 'refund' | 'bonus' | 'referral' | 'backtest' | 'strategy_generate' | 'report_create' | 'coaching_session' | 'tutor_answer'
          amount: number
          balance_after?: number | null
          feature?: string | null
          description?: string | null
          metadata?: Json | null
          payment_order_id?: string | null
          created_at?: string
        }
        Update: {
          type?: 'purchase' | 'spend' | 'refund' | 'bonus' | 'referral' | 'backtest' | 'strategy_generate' | 'report_create' | 'coaching_session' | 'tutor_answer'
          amount?: number
          balance_after?: number | null
          feature?: string | null
          description?: string | null
          metadata?: Json | null
          payment_order_id?: string | null
        }
      }

      // Credit Packages
      credit_packages: {
        Row: {
          id: string
          name: string
          credits: number
          bonus_credits: number
          price_krw: number
          price_usd: number | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          credits: number
          bonus_credits?: number
          price_krw: number
          price_usd?: number | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          credits?: number
          bonus_credits?: number
          price_krw?: number
          price_usd?: number | null
          display_order?: number
          is_active?: boolean
          updated_at?: string
        }
      }

      // Credit Costs
      credit_costs: {
        Row: {
          id: string
          feature: string
          cost: number
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          feature: string
          cost: number
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          feature?: string
          cost?: number
          description?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }

      // Referrals
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referee_id: string
          referrer_bonus: number
          referee_bonus: number
          status: 'pending' | 'completed' | 'cancelled'
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          referrer_id: string
          referee_id: string
          referrer_bonus?: number
          referee_bonus?: number
          status?: 'pending' | 'completed' | 'cancelled'
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          referrer_bonus?: number
          referee_bonus?: number
          status?: 'pending' | 'completed' | 'cancelled'
          completed_at?: string | null
        }
      }

      // Payment Orders
      payment_orders: {
        Row: {
          id: string
          user_id: string
          order_id: string
          amount: number
          credits: number
          package_id: string | null
          status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'
          payment_key: string | null
          raw: Json | null
          refund_amount: number | null
          refund_reason: string | null
          refunded_at: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_id: string
          amount: number
          credits: number
          package_id?: string | null
          status?: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'
          payment_key?: string | null
          raw?: Json | null
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'
          payment_key?: string | null
          raw?: Json | null
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          paid_at?: string | null
          updated_at?: string
        }
      }

      // AI Usage Events
      ai_usage_events: {
        Row: {
          id: string
          user_id: string
          feature: string
          credits_used: number
          tokens_input: number | null
          tokens_output: number | null
          model_used: string | null
          latency_ms: number | null
          cost_estimate_krw: number | null
          success: boolean
          error_message: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          feature: string
          credits_used?: number
          tokens_input?: number | null
          tokens_output?: number | null
          model_used?: string | null
          latency_ms?: number | null
          cost_estimate_krw?: number | null
          success?: boolean
          error_message?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          feature?: string
          credits_used?: number
          tokens_input?: number | null
          tokens_output?: number | null
          model_used?: string | null
          latency_ms?: number | null
          cost_estimate_krw?: number | null
          success?: boolean
          error_message?: string | null
          metadata?: Json | null
        }
      }

      // Safety Events
      safety_events: {
        Row: {
          id: string
          user_id: string
          feature: string
          section: string | null
          input_excerpt: string | null
          output_before: string | null
          output_after: string | null
          decision: 'allow' | 'soften' | 'block'
          policy_matched: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          feature: string
          section?: string | null
          input_excerpt?: string | null
          output_before?: string | null
          output_after?: string | null
          decision: 'allow' | 'soften' | 'block'
          policy_matched?: string[] | null
          created_at?: string
        }
        Update: {
          feature?: string
          section?: string | null
          decision?: 'allow' | 'soften' | 'block'
          policy_matched?: string[] | null
        }
      }

      // Refund Requests
      refund_requests: {
        Row: {
          id: string
          user_id: string
          order_id: string
          reason: string
          credits_used: number
          credits_total: number
          usage_rate: number
          refund_amount: number | null
          status: 'pending' | 'approved' | 'rejected' | 'completed'
          admin_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_id: string
          reason: string
          credits_used: number
          credits_total: number
          usage_rate: number
          refund_amount?: number | null
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          admin_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          created_at?: string
        }
        Update: {
          reason?: string
          refund_amount?: number | null
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          admin_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
      }

      // Refund Events
      refund_events: {
        Row: {
          id: string
          user_id: string
          order_id: string
          payment_order_id: string | null
          requested_at: string
          processed_at: string | null
          reason: string
          unused_credits: number
          refund_amount: number
          status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed'
          toss_response: Json | null
          rejection_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_id: string
          payment_order_id?: string | null
          requested_at?: string
          processed_at?: string | null
          reason: string
          unused_credits: number
          refund_amount: number
          status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed'
          toss_response?: Json | null
          rejection_reason?: string | null
          created_at?: string
        }
        Update: {
          processed_at?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed'
          toss_response?: Json | null
          rejection_reason?: string | null
        }
      }

      // Backtest Jobs
      backtest_jobs: {
        Row: {
          id: string
          user_id: string
          strategy_id: string
          job_id: string
          timeframe: string
          start_date: string
          end_date: string
          symbol: string
          status: 'queued' | 'processing' | 'completed' | 'failed'
          credits_deducted: boolean
          result: Json | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          strategy_id: string
          job_id: string
          timeframe: string
          start_date: string
          end_date: string
          symbol: string
          status?: 'queued' | 'processing' | 'completed' | 'failed'
          credits_deducted?: boolean
          result?: Json | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          status?: 'queued' | 'processing' | 'completed' | 'failed'
          credits_deducted?: boolean
          result?: Json | null
          completed_at?: string | null
        }
      }

      // Strategy Performance
      strategy_performance: {
        Row: {
          id: string
          strategy_id: string
          user_id: string
          total_return: number
          sharpe_ratio: number | null
          max_drawdown: number
          win_rate: number
          total_trades: number
          profitable_trades: number
          losing_trades: number
          avg_win: number | null
          avg_loss: number | null
          market_condition: 'bull' | 'bear' | 'sideways' | null
          start_date: string
          end_date: string
          symbol: string
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          strategy_id: string
          user_id: string
          total_return: number
          sharpe_ratio?: number | null
          max_drawdown: number
          win_rate: number
          total_trades: number
          profitable_trades: number
          losing_trades: number
          avg_win?: number | null
          avg_loss?: number | null
          market_condition?: 'bull' | 'bear' | 'sideways' | null
          start_date: string
          end_date: string
          symbol: string
          is_public?: boolean
          created_at?: string
        }
        Update: {
          total_return?: number
          sharpe_ratio?: number | null
          max_drawdown?: number
          win_rate?: number
          total_trades?: number
          profitable_trades?: number
          losing_trades?: number
          avg_win?: number | null
          avg_loss?: number | null
          market_condition?: 'bull' | 'bear' | 'sideways' | null
          is_public?: boolean
        }
      }
    }

    Views: {
      // Portfolio view aggregating trades and positions
      portfolio_summary: {
        Row: {
          user_id: string
          total_value: number
          total_pnl: number
          total_pnl_percent: number
          total_trades: number
          winning_trades: number
          losing_trades: number
        }
      }
    }

    Functions: {
      // Calculate portfolio metrics
      get_portfolio_metrics: {
        Args: { p_user_id: string }
        Returns: Json
      }
      // Get strategy performance
      get_strategy_performance: {
        Args: { p_strategy_id: string }
        Returns: Json
      }
      // Credit system functions
      get_credit_balance: {
        Args: { p_user_id: string }
        Returns: number
      }
      spend_credits: {
        Args: {
          p_user_id: string
          p_amount: number
          p_feature: string
          p_description?: string
          p_metadata?: Json
        }
        Returns: Json
      }
      add_credits: {
        Args: {
          p_user_id: string
          p_amount: number
          p_type?: string
          p_description?: string
          p_metadata?: Json
        }
        Returns: Json
      }
      // Refund functions
      calculate_refund: {
        Args: {
          p_order_id: string
          p_user_id: string
        }
        Returns: Json
      }
      process_refund: {
        Args: {
          p_order_id: string
          p_user_id: string
          p_unused_credits: number
          p_refund_amount: number
          p_reason: string
          p_toss_response: Json
        }
        Returns: void
      }
      // Backtest functions
      create_backtest_job: {
        Args: {
          p_user_id: string
          p_strategy_id: string
          p_job_id: string
          p_timeframe: string
          p_start_date: string
          p_end_date: string
          p_symbol: string
        }
        Returns: string
      }
      deduct_backtest_credits: {
        Args: {
          p_user_id: string
          p_credits: number
          p_job_id: string
        }
        Returns: void
      }
      retry_failed_backtest: {
        Args: { p_job_id: string }
        Returns: boolean
      }
      // Strategy functions
      copy_strategy: {
        Args: {
          p_source_strategy_id: string
          p_user_id: string
        }
        Returns: string
      }
      set_strategy_performance_public: {
        Args: {
          p_performance_id: string
          p_user_id: string
          p_is_public: boolean
        }
        Returns: boolean
      }
      // Cost monitoring
      check_cost_threshold: {
        Args: { p_threshold_krw?: number }
        Returns: Json[]
      }
    }

    Enums: {
      strategy_status: 'draft' | 'backtesting' | 'ready' | 'running' | 'paused' | 'stopped'
      trade_type: 'buy' | 'sell'
      trade_status: 'pending' | 'filled' | 'partial' | 'cancelled' | 'rejected'
      notification_type: 'signal' | 'trade' | 'alert' | 'system'
      user_plan: 'free' | 'pro' | 'enterprise'
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Typed table row shortcuts
export type Profile = Tables<'profiles'>
export type ExchangeConnection = Tables<'exchange_connections'>
export type Strategy = Tables<'strategies'>
export type Trade = Tables<'trades'>
export type BacktestResult = Tables<'backtest_results'>
export type Notification = Tables<'notifications'>
export type UserSettings = Tables<'user_settings'>

// Credit system types
export type CreditWallet = Tables<'credit_wallets'>
export type CreditTransaction = Tables<'credit_transactions'>
export type CreditPackage = Tables<'credit_packages'>
export type CreditCost = Tables<'credit_costs'>
export type Referral = Tables<'referrals'>

// Payment system types
export type PaymentOrder = Tables<'payment_orders'>
export type RefundRequest = Tables<'refund_requests'>
export type RefundEvent = Tables<'refund_events'>

// AI system types
export type AIUsageEvent = Tables<'ai_usage_events'>
export type SafetyEvent = Tables<'safety_events'>

// Backtest system types
export type BacktestJob = Tables<'backtest_jobs'>
export type StrategyPerformance = Tables<'strategy_performance'>
