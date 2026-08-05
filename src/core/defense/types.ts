export interface DefensePhaseZone {
  successZoneStart: number
  successZoneEnd: number
}

export interface DefenseFailureEffect {
  statusType: string
  duration: number
  damagePerTurn?: number
}

export const DEFENSE_BAR_WIDTH = 30
export const DEFENSE_PHASE_TIMEOUT_MS = 5000
export const DEFAULT_WAVE_SPEED = 30
export const DEFAULT_SUCCESS_ZONE_SIZE = 0.10

export interface DefensePatternConfig {
  name?: string
  phaseCount: number
  waveSpeed?: number
  baseSuccessZoneSize?: number
  baseMaxBlockReduction: number
  seed?: number
  onFailureEffect?: DefenseFailureEffect
}

export type DefensePhaseOutcome = 'success' | 'fail' | 'timeout'

export interface DefensePhaseResult {
  outcome: DefensePhaseOutcome
  waveColumn: number
  zone: DefensePhaseZone
}

export interface DefenseChallengeResult {
  pattern: DefensePatternConfig
  phaseResults: DefensePhaseResult[]
  totalDamage: number
  appliedOnFailureEffect: boolean
  triggeredCounterAttack: boolean
}

export interface DefenseSuccessZoneCap {
  start: number
  end: number
}

export function clampSuccessZoneSize(size: number): number {
  if (size < 0) return 0
  if (size > 0.5) return 0.5
  return size
}
