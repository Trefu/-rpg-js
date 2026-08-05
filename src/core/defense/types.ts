export interface DefensePhaseZone {
  successZoneStart: number
  successZoneEnd: number
}

export interface DefenseFailureEffect {
  statusType: string
  duration: number
  damagePerTurn?: number
}

export interface DefensePatternConfig {
  phaseCount: number
  waveSpeed: number
  barWidth: number
  baseSuccessZoneSize: number
  baseMaxBlockReduction: number
  phaseTimeoutMs: number
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
