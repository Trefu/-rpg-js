export type TimingResult = 'critical' | 'bonus' | 'normal' | 'miss'

export interface TimingCircleConfig {
  closeDurationMs: number
  bonusZoneSize: number
  outerRadius: number
  direction: 'inward' | 'outward'
  color: string
  successWindow: number
  criticalRadius: number
}

export interface TimingResultData {
  result: TimingResult
  accuracy: number
  timePressed: number
}

export const BASIC_ATTACK_CONFIG: TimingCircleConfig = {
  closeDurationMs: 1000,
  bonusZoneSize: 50,
  outerRadius: 350,
  direction: 'inward',
  color: '#FF5722',
  successWindow: 25,
  criticalRadius: 15
}
