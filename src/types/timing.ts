export type TimingResult = 'critical' | 'bonus' | 'normal' | 'miss'

export interface TimingCircleConfig {
  shrinkSpeed: number
  criticalZoneSize: number
  outerRadius: number
  direction: 'inward' | 'outward'
  color: string
  successWindow: number
  centerDotRadius: number
}

export interface TimingResultData {
  result: TimingResult
  accuracy: number
  timePressed: number
}

export const BASIC_ATTACK_CONFIG: TimingCircleConfig = {
  shrinkSpeed: 400,
  criticalZoneSize: 30,
  outerRadius: 250,
  direction: 'inward',
  color: '#FF5722',
  successWindow: 25,
  centerDotRadius: 10
}

export const TIMING_MULTIPLIERS = {
  critical: 2.5,
  bonus: 1.5,
  normal: 1.0,
  miss: 0.25
} as const