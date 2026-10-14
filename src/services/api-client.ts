/**
 * Base API client simulation helper.
 * Provides configurable latency, mock delay, and simulated async error boundaries.
 */

export const DEFAULT_MOCK_DELAY_MS = 200

export function mockDelay<T>(value: T, ms = DEFAULT_MOCK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export function mockDelayError<T = never>(errorMessage: string, ms = DEFAULT_MOCK_DELAY_MS): Promise<T> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(errorMessage)), ms))
}

export interface AsyncSelectOption {
  value: string
  label: string
  sublabel?: string
  data?: any
}
