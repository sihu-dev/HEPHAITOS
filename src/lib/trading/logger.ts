// ============================================
// Structured Logger for Trading Executor (2026)
// Inspired by: Datadog, Sentry, QuantConnect Logging
// ============================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'

export interface LogEntry {
  timestamp: Date
  level: LogLevel
  component: string
  message: string
  data?: Record<string, unknown>
  error?: Error
  userId?: string
  symbol?: string
  orderId?: string
}

export interface LoggerConfig {
  minLevel: LogLevel
  enableConsole: boolean
  enableFile?: boolean
  enableRemote?: boolean // Future: Send to Sentry/Datadog
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  critical: 4,
}

/**
 * Structured Logger Class (2026)
 *
 * Features:
 * - Log levels with filtering
 * - Structured data logging
 * - Component-based logging
 * - Error tracking with stack traces
 * - Future: Integration with Sentry/Datadog
 */
export class TradingLogger {
  private config: LoggerConfig
  private logs: LogEntry[] = []
  private readonly MAX_LOGS = 1000 // Keep last 1000 logs in memory

  constructor(config: LoggerConfig = {
    minLevel: 'info',
    enableConsole: true,
    enableFile: false,
    enableRemote: false,
  }) {
    this.config = config
  }

  /**
   * Log debug message (most verbose)
   */
  debug(component: string, message: string, data?: Record<string, unknown>): void {
    this.log('debug', component, message, data)
  }

  /**
   * Log info message
   */
  info(component: string, message: string, data?: Record<string, unknown>): void {
    this.log('info', component, message, data)
  }

  /**
   * Log warning message
   */
  warn(component: string, message: string, data?: Record<string, unknown>): void {
    this.log('warn', component, message, data)
  }

  /**
   * Log error message
   */
  error(component: string, message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log('error', component, message, data, error)
  }

  /**
   * Log critical error (highest severity)
   */
  critical(component: string, message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log('critical', component, message, data, error)
  }

  /**
   * Log a structured entry
   */
  private log(
    level: LogLevel,
    component: string,
    message: string,
    data?: Record<string, unknown>,
    error?: Error
  ): void {
    // Filter by log level
    if (LOG_LEVELS[level] < LOG_LEVELS[this.config.minLevel]) {
      return
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      component,
      message,
      data,
      error,
      userId: data?.userId as string | undefined,
      symbol: data?.symbol as string | undefined,
      orderId: data?.orderId as string | undefined,
    }

    // Store in memory
    this.logs.push(entry)
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS)
    }

    // Console output
    if (this.config.enableConsole) {
      this.logToConsole(entry)
    }

    // Future: File output
    if (this.config.enableFile) {
      // TODO: Implement file logging
    }

    // Future: Remote logging (Sentry/Datadog)
    if (this.config.enableRemote) {
      // TODO: Send to remote service
    }
  }

  /**
   * Format and output to console
   */
  private logToConsole(entry: LogEntry): void {
    const emoji = this.getLevelEmoji(entry.level)
    const timestamp = entry.timestamp.toISOString().split('T')[1].slice(0, 12)
    const prefix = `[${timestamp}] ${emoji} [${entry.component}]`

    const consoleMethod = entry.level === 'critical' || entry.level === 'error' ? 'error' :
                         entry.level === 'warn' ? 'warn' : 'log'

    if (entry.error) {
      console[consoleMethod](`${prefix} ${entry.message}`, entry.error)
      if (entry.data) {
        console[consoleMethod](`${prefix} Data:`, entry.data)
      }
    } else if (entry.data) {
      console[consoleMethod](`${prefix} ${entry.message}`, entry.data)
    } else {
      console[consoleMethod](`${prefix} ${entry.message}`)
    }
  }

  /**
   * Get emoji for log level
   */
  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case 'debug': return '🐛'
      case 'info': return 'ℹ️'
      case 'warn': return '⚠️'
      case 'error': return '❌'
      case 'critical': return '🚨'
    }
  }

  /**
   * Get all logs (for debugging)
   */
  getLogs(filter?: { level?: LogLevel; component?: string; since?: Date }): LogEntry[] {
    let filtered = this.logs

    if (filter?.level) {
      const minLevel = LOG_LEVELS[filter.level]
      filtered = filtered.filter(log => LOG_LEVELS[log.level] >= minLevel)
    }

    if (filter?.component) {
      filtered = filtered.filter(log => log.component === filter.component)
    }

    if (filter?.since) {
      filtered = filtered.filter(log => log.timestamp >= filter.since!)
    }

    return filtered
  }

  /**
   * Get error count by component
   */
  getErrorCount(component?: string): number {
    let errors = this.logs.filter(log => log.level === 'error' || log.level === 'critical')
    if (component) {
      errors = errors.filter(log => log.component === component)
    }
    return errors.length
  }

  /**
   * Clear old logs
   */
  clearOldLogs(olderThan: Date): void {
    this.logs = this.logs.filter(log => log.timestamp >= olderThan)
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * Change log level at runtime
   */
  setLogLevel(level: LogLevel): void {
    this.config.minLevel = level
    this.info('TradingLogger', `Log level changed to: ${level}`)
  }
}

// ============================================
// Singleton Instance
// ============================================

export const logger = new TradingLogger({
  minLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  enableConsole: true,
  enableFile: false,
  enableRemote: false,
})

// ============================================
// Error Metrics Tracker (2026)
// ============================================

export interface ErrorMetrics {
  totalErrors: number
  errorsByType: Record<string, number>
  errorsByComponent: Record<string, number>
  criticalErrors: number
  lastError?: LogEntry
  errorRate: number // Errors per minute
}

export class ErrorMetricsTracker {
  private errors: LogEntry[] = []
  private readonly WINDOW_MS = 60 * 1000 // 1 minute window

  /**
   * Track an error
   */
  track(entry: LogEntry): void {
    if (entry.level === 'error' || entry.level === 'critical') {
      this.errors.push(entry)

      // Keep only last minute of errors
      const cutoff = new Date(Date.now() - this.WINDOW_MS)
      this.errors = this.errors.filter(e => e.timestamp >= cutoff)
    }
  }

  /**
   * Get current error metrics
   */
  getMetrics(): ErrorMetrics {
    const now = Date.now()
    const cutoff = new Date(now - this.WINDOW_MS)
    const recentErrors = this.errors.filter(e => e.timestamp >= cutoff)

    const errorsByType: Record<string, number> = {}
    const errorsByComponent: Record<string, number> = {}
    let criticalErrors = 0

    for (const error of recentErrors) {
      // By type
      const errorType = error.error?.name || 'Unknown'
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1

      // By component
      errorsByComponent[error.component] = (errorsByComponent[error.component] || 0) + 1

      // Critical count
      if (error.level === 'critical') {
        criticalErrors++
      }
    }

    return {
      totalErrors: recentErrors.length,
      errorsByType,
      errorsByComponent,
      criticalErrors,
      lastError: recentErrors[recentErrors.length - 1],
      errorRate: recentErrors.length, // Errors per minute
    }
  }

  /**
   * Check if error rate is too high
   */
  isErrorRateHigh(threshold = 10): boolean {
    return this.getMetrics().errorRate > threshold
  }
}

export const errorMetrics = new ErrorMetricsTracker()
