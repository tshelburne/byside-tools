export interface NumberFormatOptions {
  /** Number of decimal places (default: 2) */
  decimals?: number
  /** Locale for formatting (default: 'en-US') */
  locale?: string
}

/**
 * Format a number with thousands separators
 * Example: formatNumber(1234567.89) -> "1,234,567.89"
 */
export function formatNumber(value: number, options: NumberFormatOptions = {}): string {
  const { decimals, locale = 'en-US' } = options
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export interface CurrencyFormatOptions extends NumberFormatOptions {
  /** Currency code (default: 'USD') */
  currency?: string
}

/**
 * Format a number as currency
 * Example: formatCurrency(1234.5) -> "$1,234.50"
 */
export function formatCurrency(value: number, options: CurrencyFormatOptions = {}): string {
  const { currency = 'USD', locale = 'en-US', decimals = 2 } = options
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export interface PercentFormatOptions extends NumberFormatOptions {
  /** Whether value is already a percentage (true) or a decimal (false, default) */
  alreadyPercent?: boolean
}

/**
 * Format a number as a percentage
 * Example: formatPercent(0.125) -> "12.5%"
 * Example: formatPercent(12.5, { alreadyPercent: true }) -> "12.5%"
 */
export function formatPercent(value: number, options: PercentFormatOptions = {}): string {
  const { decimals = 1, locale = 'en-US', alreadyPercent = false } = options
  const percentValue = alreadyPercent ? value / 100 : value
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(percentValue)
}

/**
 * Format bytes into human-readable string
 * Example: formatBytes(1024) -> "1 KB"
 * Example: formatBytes(1234567) -> "1.18 MB"
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

export type DateFormatStyle = 'short' | 'medium' | 'long' | 'full' | 'iso' | 'relative'

export interface DateFormatOptions {
  /** Format style (default: 'medium') */
  style?: DateFormatStyle
  /** Locale for formatting (default: 'en-US') */
  locale?: string
  /** Include time in output (default: false) */
  includeTime?: boolean
}

/**
 * Format a date
 * Example: formatDate(new Date()) -> "Dec 8, 2024"
 * Example: formatDate(new Date(), { style: 'iso' }) -> "2024-12-08"
 */
export function formatDate(date: Date, options: DateFormatOptions = {}): string {
  const { style = 'medium', locale = 'en-US', includeTime = false } = options

  if (style === 'iso') {
    return includeTime ? date.toISOString() : (date.toISOString().split('T')[0] ?? '')
  }

  if (style === 'relative') {
    return formatRelativeTime(date)
  }

  const dateStyle = style as Intl.DateTimeFormatOptions['dateStyle']
  return new Intl.DateTimeFormat(locale, {
    dateStyle,
    timeStyle: includeTime ? dateStyle : undefined,
  }).format(date)
}

/**
 * Format a date as relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: Date, locale = 'en-US'): string {
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffSecs = Math.round(diffMs / 1000)
  const diffMins = Math.round(diffSecs / 60)
  const diffHours = Math.round(diffMins / 60)
  const diffDays = Math.round(diffHours / 24)

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (Math.abs(diffSecs) < 60) return rtf.format(diffSecs, 'second')
  if (Math.abs(diffMins) < 60) return rtf.format(diffMins, 'minute')
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour')
  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, 'day')
  if (Math.abs(diffDays) < 365) return rtf.format(Math.round(diffDays / 30), 'month')
  return rtf.format(Math.round(diffDays / 365), 'year')
}

/**
 * Format a duration in milliseconds to human-readable string
 * Example: formatDuration(3661000) -> "1h 1m 1s"
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000) % 60
  const minutes = Math.floor(ms / (1000 * 60)) % 60
  const hours = Math.floor(ms / (1000 * 60 * 60)) % 24
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))

  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`)

  return parts.join(' ')
}

/**
 * Format a phone number (US format)
 * Example: formatPhone('5551234567') -> "(555) 123-4567"
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  return value
}
