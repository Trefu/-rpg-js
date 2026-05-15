export type TimingResult = 'perfect' | 'good' | 'normal' | 'miss'

export interface TimingCircleConfig {
  shrinkSpeed: number
  criticalZoneSize: number
  outerRadius: number
  direction: 'inward' | 'outward'
  color: string
  successWindow: number
}

export interface TimingResultData {
  result: TimingResult
  accuracy: number
  timePressed: number
}

export const BASIC_ATTACK_CONFIG: TimingCircleConfig = {
  shrinkSpeed: 80,
  criticalZoneSize: 30,
  outerRadius: 150,
  direction: 'inward',
  color: '#FF5722',
  successWindow: 15
}

export const TIMING_MULTIPLIERS = {
  perfect: 2.0,
  good: 1.5,
  normal: 1.0,
  miss: 0.25
} as const