/**
 * Finnhub API error types.
 * Separated from the client to avoid Turbopack compilation issues.
 */

export class FinnhubError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly endpoint: string
  ) {
    super(`Finnhub ${endpoint} [${status}]: ${message}`)
    this.name = 'FinnhubError'
  }
}

export class FinnhubRateLimitError extends FinnhubError {
  constructor(endpoint: string) {
    super(429, 'Rate limit exceeded. Please wait before retrying.', endpoint)
    this.name = 'FinnhubRateLimitError'
  }
}

export class FinnhubNotFoundError extends FinnhubError {
  constructor(endpoint: string, symbol: string) {
    super(404, `No data found for symbol: ${symbol}`, endpoint)
    this.name = 'FinnhubNotFoundError'
  }
}
