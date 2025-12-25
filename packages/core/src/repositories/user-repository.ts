/**
 * @hephaitos/core - User Repository
 * L2 (Cells) - 사용자 데이터 저장소
 */

import { randomUUID } from 'node:crypto';
import type {
  IResult,
  IUser,
  IUserSettings,
  IUserStats,
  ICreateUserInput,
  IUpdateUserInput,
  DEFAULT_USER_SETTINGS,
} from '@hephaitos/types';

/**
 * 사용자 저장소 인터페이스
 */
export interface IUserRepository {
  /** 사용자 생성 */
  create(input: ICreateUserInput): Promise<IResult<IUser>>;

  /** ID로 사용자 조회 */
  getById(id: string): Promise<IResult<IUser | null>>;

  /** 이메일로 사용자 조회 */
  getByEmail(email: string): Promise<IResult<IUser | null>>;

  /** 사용자명으로 사용자 조회 */
  getByUsername(username: string): Promise<IResult<IUser | null>>;

  /** 사용자 목록 조회 */
  getAll(): Promise<IResult<IUser[]>>;

  /** 사용자 업데이트 */
  update(id: string, updates: IUpdateUserInput): Promise<IResult<IUser>>;

  /** 사용자 삭제 */
  delete(id: string): Promise<IResult<boolean>>;

  /** 사용자 설정 저장 */
  saveSettings(settings: IUserSettings): Promise<IResult<IUserSettings>>;

  /** 사용자 설정 조회 */
  getSettings(userId: string): Promise<IResult<IUserSettings | null>>;

  /** 사용자 통계 저장 */
  saveStats(stats: IUserStats): Promise<IResult<IUserStats>>;

  /** 사용자 통계 조회 */
  getStats(userId: string): Promise<IResult<IUserStats | null>>;

  /** 마지막 로그인 시간 업데이트 */
  updateLastLogin(id: string): Promise<IResult<void>>;
}

/**
 * 인메모리 사용자 저장소 (개발/테스트용)
 */
export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, IUser> = new Map();
  private settings: Map<string, IUserSettings> = new Map();
  private stats: Map<string, IUserStats> = new Map();

  async create(input: ICreateUserInput): Promise<IResult<IUser>> {
    const startTime = Date.now();
    try {
      // 이메일 중복 체크
      const existingByEmail = Array.from(this.users.values()).find(
        (u) => u.email === input.email
      );
      if (existingByEmail) {
        return {
          success: false,
          error: new Error(`User with email ${input.email} already exists`),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      // 사용자명 중복 체크
      const existingByUsername = Array.from(this.users.values()).find(
        (u) => u.username === input.username
      );
      if (existingByUsername) {
        return {
          success: false,
          error: new Error(`User with username ${input.username} already exists`),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      const now = new Date().toISOString();
      const user: IUser = {
        id: randomUUID(),
        email: input.email,
        username: input.username,
        full_name: input.full_name,
        role: input.role ?? 'free',
        status: 'active',
        email_verified: false,
        created_at: now,
        updated_at: now,
      };

      this.users.set(user.id, user);

      // 기본 설정 생성
      const defaultSettings: IUserSettings = {
        user_id: user.id,
        language: 'ko',
        timezone: 'Asia/Seoul',
        currency: 'KRW',
        notifications: {
          email_enabled: true,
          push_enabled: true,
          order_fills: true,
          price_alerts: true,
          daily_reports: false,
          weekly_reports: true,
        },
        trading: {
          default_execution_mode: 'simulation',
          require_order_confirmation: true,
          auto_stop_loss: false,
          auto_take_profit: false,
          show_risk_warnings: true,
        },
        created_at: now,
        updated_at: now,
      };
      this.settings.set(user.id, defaultSettings);

      // 기본 통계 생성
      const defaultStats: IUserStats = {
        user_id: user.id,
        total_trades: 0,
        winning_trades: 0,
        losing_trades: 0,
        win_rate: 0,
        total_profit: 0,
        total_loss: 0,
        net_profit: 0,
        max_drawdown: 0,
        active_strategies: 0,
        active_positions: 0,
        calculated_at: now,
      };
      this.stats.set(user.id, defaultStats);

      return {
        success: true,
        data: user,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async getById(id: string): Promise<IResult<IUser | null>> {
    const startTime = Date.now();
    try {
      const user = this.users.get(id) ?? null;

      return {
        success: true,
        data: user,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async getByEmail(email: string): Promise<IResult<IUser | null>> {
    const startTime = Date.now();
    try {
      const user = Array.from(this.users.values()).find((u) => u.email === email) ?? null;

      return {
        success: true,
        data: user,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async getByUsername(username: string): Promise<IResult<IUser | null>> {
    const startTime = Date.now();
    try {
      const user = Array.from(this.users.values()).find((u) => u.username === username) ?? null;

      return {
        success: true,
        data: user,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async getAll(): Promise<IResult<IUser[]>> {
    const startTime = Date.now();
    try {
      const users = Array.from(this.users.values());

      return {
        success: true,
        data: users,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async update(id: string, updates: IUpdateUserInput): Promise<IResult<IUser>> {
    const startTime = Date.now();
    try {
      const existing = this.users.get(id);

      if (!existing) {
        return {
          success: false,
          error: new Error(`User not found: ${id}`),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      // 사용자명 중복 체크 (변경하는 경우)
      if (updates.username && updates.username !== existing.username) {
        const existingByUsername = Array.from(this.users.values()).find(
          (u) => u.username === updates.username && u.id !== id
        );
        if (existingByUsername) {
          return {
            success: false,
            error: new Error(`Username ${updates.username} is already taken`),
            metadata: {
              timestamp: new Date().toISOString(),
              duration_ms: Date.now() - startTime,
            },
          };
        }
      }

      const updated: IUser = {
        ...existing,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      this.users.set(id, updated);

      return {
        success: true,
        data: updated,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async delete(id: string): Promise<IResult<boolean>> {
    const startTime = Date.now();
    try {
      const existed = this.users.has(id);

      if (!existed) {
        return {
          success: false,
          error: new Error(`User not found: ${id}`),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      this.users.delete(id);
      this.settings.delete(id);
      this.stats.delete(id);

      return {
        success: true,
        data: true,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async saveSettings(settings: IUserSettings): Promise<IResult<IUserSettings>> {
    const startTime = Date.now();
    try {
      const updatedSettings: IUserSettings = {
        ...settings,
        updated_at: new Date().toISOString(),
      };

      this.settings.set(settings.user_id, updatedSettings);

      return {
        success: true,
        data: updatedSettings,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async getSettings(userId: string): Promise<IResult<IUserSettings | null>> {
    const startTime = Date.now();
    try {
      const settings = this.settings.get(userId) ?? null;

      return {
        success: true,
        data: settings,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async saveStats(stats: IUserStats): Promise<IResult<IUserStats>> {
    const startTime = Date.now();
    try {
      this.stats.set(stats.user_id, stats);

      return {
        success: true,
        data: stats,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async getStats(userId: string): Promise<IResult<IUserStats | null>> {
    const startTime = Date.now();
    try {
      const stats = this.stats.get(userId) ?? null;

      return {
        success: true,
        data: stats,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async updateLastLogin(id: string): Promise<IResult<void>> {
    const startTime = Date.now();
    try {
      const existing = this.users.get(id);

      if (!existing) {
        return {
          success: false,
          error: new Error(`User not found: ${id}`),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      const updated: IUser = {
        ...existing,
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      this.users.set(id, updated);

      return {
        success: true,
        data: undefined,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }
}

/**
 * 팩토리 함수 - UserRepository 생성
 */
export function createUserRepository(): IUserRepository {
  return new InMemoryUserRepository();
}
