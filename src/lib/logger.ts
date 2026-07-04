/**
 * Simple structured logger for the Investment Research Agent.
 * Logs API requests, response times, errors, and cache hits/misses.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  timestamp: string
  level: LogLevel
  module: string
  message: string
  durationMs?: number
  meta?: Record<string, unknown>
}

class Logger {
  private enabled = true

  private log(level: LogLevel, module: string, message: string, durationMs?: number, meta?: Record<string, unknown>) {
    if (!this.enabled) return
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      ...(durationMs !== undefined && { durationMs: Math.round(durationMs) }),
      ...(meta && { meta }),
    }
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] [${module}]`
    const detail = durationMs !== undefined ? ` (${durationMs}ms)` : ''
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : ''

    switch (level) {
      case 'error':
        console.error(`${prefix} ${message}${detail}${metaStr}`)
        break
      case 'warn':
        console.warn(`${prefix} ${message}${detail}${metaStr}`)
        break
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.debug(`${prefix} ${message}${detail}${metaStr}`)
        }
        break
      default:
        console.log(`${prefix} ${message}${detail}${metaStr}`)
    }
  }

  info(module: string, message: string, meta?: Record<string, unknown>) {
    this.log('info', module, message, undefined, meta)
  }

  warn(module: string, message: string, meta?: Record<string, unknown>) {
    this.log('warn', module, message, undefined, meta)
  }

  error(module: string, message: string, meta?: Record<string, unknown>) {
    this.log('error', module, message, undefined, meta)
  }

  debug(module: string, message: string, meta?: Record<string, unknown>) {
    this.log('debug', module, message, undefined, meta)
  }

  /** Time an async operation and log the result */
  async time<T>(module: string, label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      this.info(module, `${label} — success`, { durationMs: Math.round(duration) })
      return result
    } catch (err) {
      const duration = performance.now() - start
      this.error(module, `${label} — failed`, { durationMs: Math.round(duration), error: String(err) })
      throw err
    }
  }
}

export const logger = new Logger()