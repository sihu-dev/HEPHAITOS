/**
 * @hephaitos/core - Report Generation Service
 * L2 (Cells) - 성과 리포트 생성 서비스
 */

import { randomUUID } from 'node:crypto';
import type { IResult, IPerformanceMetrics, IBacktestResult } from '@hephaitos/types';

/**
 * 리포트 타입
 */
export type ReportType = 'daily' | 'weekly' | 'monthly' | 'custom' | 'backtest';

/**
 * 리포트 포맷
 */
export type ReportFormat = 'json' | 'html' | 'pdf' | 'markdown';

/**
 * 리포트 생성 입력
 */
export interface IGenerateReportInput {
  /** 사용자 ID */
  user_id: string;
  /** 리포트 타입 */
  type: ReportType;
  /** 시작일 */
  start_date: string;
  /** 종료일 */
  end_date: string;
  /** 포맷 */
  format?: ReportFormat;
  /** 성과 지표 포함 여부 */
  include_metrics?: boolean;
  /** 차트 포함 여부 */
  include_charts?: boolean;
}

/**
 * 생성된 리포트
 */
export interface IGeneratedReport {
  /** 리포트 ID */
  id: string;
  /** 사용자 ID */
  user_id: string;
  /** 타입 */
  type: ReportType;
  /** 포맷 */
  format: ReportFormat;
  /** 제목 */
  title: string;
  /** 내용 (JSON 또는 HTML) */
  content: string;
  /** 파일 URL (PDF인 경우) */
  file_url?: string;
  /** 기간 */
  period: {
    start: string;
    end: string;
  };
  /** 성과 지표 */
  metrics?: IPerformanceMetrics;
  /** 생성일 */
  generated_at: string;
}

/**
 * 리포트 생성 서비스 인터페이스
 */
export interface IReportGenerationService {
  /** 리포트 생성 */
  generate(input: IGenerateReportInput): Promise<IResult<IGeneratedReport>>;

  /** 백테스트 리포트 생성 */
  generateBacktestReport(result: IBacktestResult, format?: ReportFormat): Promise<IResult<IGeneratedReport>>;

  /** 일일 리포트 생성 */
  generateDailyReport(userId: string, date: string): Promise<IResult<IGeneratedReport>>;

  /** 주간 리포트 생성 */
  generateWeeklyReport(userId: string, weekStart: string): Promise<IResult<IGeneratedReport>>;

  /** 리포트 조회 */
  getReport(reportId: string): Promise<IResult<IGeneratedReport | null>>;

  /** 사용자별 리포트 목록 */
  getReportsByUser(userId: string): Promise<IResult<IGeneratedReport[]>>;
}

/**
 * 리포트 생성 서비스 구현
 */
export class ReportGenerationService implements IReportGenerationService {
  private reports: Map<string, IGeneratedReport> = new Map();

  async generate(input: IGenerateReportInput): Promise<IResult<IGeneratedReport>> {
    const startTime = Date.now();
    try {
      const report: IGeneratedReport = {
        id: randomUUID(),
        user_id: input.user_id,
        type: input.type,
        format: input.format ?? 'json',
        title: `${this.getReportTypeLabel(input.type)} Report`,
        content: this.generateContent(input),
        period: {
          start: input.start_date,
          end: input.end_date,
        },
        generated_at: new Date().toISOString(),
      };

      this.reports.set(report.id, report);

      return {
        success: true,
        data: report,
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

  async generateBacktestReport(result: IBacktestResult, format: ReportFormat = 'json'): Promise<IResult<IGeneratedReport>> {
    const startTime = Date.now();
    try {
      const report: IGeneratedReport = {
        id: randomUUID(),
        user_id: 'backtest-user', // TODO: Get from context
        type: 'backtest',
        format,
        title: `Backtest Report: Strategy ${result.strategyId}`,
        content: JSON.stringify(result, null, 2),
        period: {
          start: result.startedAt,
          end: result.completedAt || result.startedAt,
        },
        metrics: result.metrics,
        generated_at: new Date().toISOString(),
      };

      this.reports.set(report.id, report);

      return {
        success: true,
        data: report,
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

  async generateDailyReport(userId: string, date: string): Promise<IResult<IGeneratedReport>> {
    return this.generate({
      user_id: userId,
      type: 'daily',
      start_date: date,
      end_date: date,
      format: 'json',
      include_metrics: true,
    });
  }

  async generateWeeklyReport(userId: string, weekStart: string): Promise<IResult<IGeneratedReport>> {
    // Calculate week end (7 days later)
    const startDate = new Date(weekStart);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    return this.generate({
      user_id: userId,
      type: 'weekly',
      start_date: weekStart,
      end_date: endDate.toISOString().split('T')[0],
      format: 'json',
      include_metrics: true,
    });
  }

  async getReport(reportId: string): Promise<IResult<IGeneratedReport | null>> {
    const startTime = Date.now();
    try {
      const report = this.reports.get(reportId) ?? null;

      return {
        success: true,
        data: report,
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

  async getReportsByUser(userId: string): Promise<IResult<IGeneratedReport[]>> {
    const startTime = Date.now();
    try {
      const reports = Array.from(this.reports.values()).filter(
        (r) => r.user_id === userId
      );

      // Sort by generated_at desc
      reports.sort((a, b) => b.generated_at.localeCompare(a.generated_at));

      return {
        success: true,
        data: reports,
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

  private getReportTypeLabel(type: ReportType): string {
    const labels: Record<ReportType, string> = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      custom: 'Custom',
      backtest: 'Backtest',
    };
    return labels[type];
  }

  private generateContent(input: IGenerateReportInput): string {
    // TODO: 실제 데이터 수집 및 리포트 생성
    // 현재는 Mock 데이터
    const content = {
      type: input.type,
      period: {
        start: input.start_date,
        end: input.end_date,
      },
      summary: 'Report generated successfully',
      // TODO: Add actual trading data, metrics, charts
    };

    return JSON.stringify(content, null, 2);
  }
}

/**
 * 팩토리 함수
 */
export function createReportGenerationService(): IReportGenerationService {
  return new ReportGenerationService();
}
