/**
 * @hephaitos/types - Common Types
 * L0 (Atoms) - 공통 기초 타입 정의
 */

/**
 * 고유 식별자 타입
 */
export type UUID = string;

/**
 * 타임스탬프 (ISO 8601 형식)
 */
export type Timestamp = string;

/**
 * 결과 메타데이터
 */
export interface IResultMetadata {
  /** 실행 시점 (ISO 8601) */
  timestamp: Timestamp;
  /** 실행 시간 (ms) */
  duration_ms: number;
  /** 요청 추적 ID (선택) */
  request_id?: UUID;
}

/**
 * 결과 래퍼 타입 (성공/실패 구분)
 */
export interface IResult<T, E = Error> {
  /** 성공 여부 */
  success: boolean;
  /** 성공 시 데이터 */
  data?: T;
  /** 실패 시 에러 */
  error?: E;
  /** 메타데이터 */
  metadata: IResultMetadata;
}

/**
 * 페이지네이션 정보
 */
export interface IPagination {
  /** 현재 페이지 */
  page: number;
  /** 페이지당 항목 수 */
  limit: number;
  /** 전체 항목 수 */
  total: number;
  /** 다음 페이지 존재 여부 */
  hasMore: boolean;
}

/**
 * 페이지네이션 결과
 */
export interface IPaginatedResult<T> extends IResult<T[]> {
  /** 페이지네이션 정보 */
  pagination: IPagination;
}

/**
 * 결과 생성 헬퍼
 */
export function createResult<T>(data: T, startTime: number): IResult<T> {
  return {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    },
  };
}

/**
 * 에러 결과 생성 헬퍼
 */
export function createErrorResult<T>(error: Error, startTime: number): IResult<T> {
  return {
    success: false,
    error,
    metadata: {
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    },
  };
}
