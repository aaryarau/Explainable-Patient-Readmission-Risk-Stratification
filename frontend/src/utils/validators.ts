export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidPassword(pw: string): boolean {
  return pw.length >= 8
}

export function isValidDataset(ds: string): boolean {
  return ['diabetes', 'heart'].includes(ds)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function isNumeric(value: unknown): boolean {
  return typeof value === 'number' && !Number.isNaN(value)
}
