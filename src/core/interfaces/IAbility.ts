import type { ICharacter } from './ICharacter'
import type { AudioManager } from '../AudioManager'

export type TimingResult = 'critical' | 'bonus' | 'normal' | 'miss'

export interface AbilityContext {
  caster: ICharacter
  target: ICharacter
  addToLog: (message: string) => void
  showEnemyHit: (id: string, value: number) => void
  showAnnouncement: (text: string, variant?: 'info' | 'attack' | 'status' | 'turn' | 'crit', duration?: number) => void
  performTimingChallenge: () => Promise<TimingResult>
  audioManager: AudioManager
  damageMultiplier?: number
  timingResult?: TimingResult
}

/**
 * Restringe los objetivos que una habilidad puede seleccionar.
 * - 'all': cualquier objetivo (aliados o enemigos)
 * - 'enemies-only': solo enemigos
 * - 'allies-only': solo aliados (incluye al caster)
 */
export type AbilityTargetType = 'all' | 'enemies-only' | 'allies-only'

export interface IAbility {
  name: string
  description: string
  type: string
  cooldown: number
  damage?: number
  energyCost?: number
  energyCostOnCrit?: number
  customCriticalMultiplier?: number
  /** Define a que tipo de personajes puede apuntar esta habilidad. Default: 'enemies-only'. */
  targetType?: AbilityTargetType
  /** Si es true, dispara el QTE (timing challenge) antes de ejecutar. Default: true. */
  requiresTiming?: boolean
  execute: (context: AbilityContext) => Promise<void>
} 