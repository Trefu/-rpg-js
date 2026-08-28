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
  timingResult?: TimingResult
  /**
   * Cantidad de energia que se desconto del caster al validar la accion.
   * Las abilities pueden cobrar este valor en su execute si la mecanica lo requiere.
   */
  energySpent?: number
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
  /**
   * Costo fijo de energia que se cobra ANTES del QTE.
   * Si el caster no tiene suficiente energia, la accion se cancela antes de gastar el turno.
   */
  energyCost?: number
  /**
   * Costo de energia que se cobra solo si el resultado del QTE es 'critical'.
   * Validado ANTES de ejecutar; si no alcanza, la accion se cancela.
   */
  energyCostOnCrit?: number
  /** Multiplicador custom para dano critico (default global: 2.5). */
  customCriticalMultiplier?: number
  /** Define a que tipo de personajes puede apuntar esta habilidad. Default: 'enemies-only'. */
  targetType?: AbilityTargetType
  /** Si es true, dispara el QTE (timing challenge) antes de ejecutar. Default: true. */
  requiresTiming?: boolean
  execute: (context: AbilityContext) => Promise<void>
} 