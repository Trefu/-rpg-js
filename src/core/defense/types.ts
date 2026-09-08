import type { VfxEffect } from '../interfaces/IAbility'
import type { DamageTypeId } from '../combat/damageTypes'

export interface DefensePhaseZone {
  /**
   * Índices de columna (0-indexed, en [0, DEFENSE_BAR_WIDTH)) que cuentan
   * como éxito para esta fase. Modelo discreto que coincide con la grilla
   * visual de la barra de defensa.
   */
  successColumns: number[]
  /**
   * Velocidad efectiva de la onda en esta fase (columnas/segundo).
   * Ya incluye los modificadores del jugador aplicados por `applyModifiersToPattern`.
   * Si la fase no define `waveSpeed`, se hereda del patrón.
   */
  waveSpeed: number
}

export interface DefenseFailureEffect {
  statusType: string
  stacks?: number
  /**
   * Override explicito de la duracion maxima (turnos) del efecto aplicado
   * al fallar el bloqueo. Util para efectos no-DoT (ej. INJURED, STUN)
   * cuya duracion no debe seguir la regla default de DoTs.
   */
  maxDuration?: number
}

/**
 * Override de los VFX que se muestran sobre el heroe cuando recibe dano sin
 * bloquear durante un desafio de defensa contra este patron.
 *
 * - `impact`: dano normal (no critico).
 * - `bigHit`: dano critico.
 *
 * Si una clave se omite, se usa el default registrado en
 * `src/core/defense/failureVfx.ts` (Effect_Impact / Effect_BigHit).
 * Cada clave admite un `VfxEffect` unico o un array; se toma siempre el
 * primero (un solo gif por fase fallida, igual que el sistema de slashes).
 */
export interface DefenseFailureVfxConfig {
  impact?: VfxEffect | VfxEffect[]
  bigHit?: VfxEffect | VfxEffect[]
}

/**
 * Tipo elemental del ataque. Re-export del registro canonico en
 * `core/combat/damageTypes.ts`. Mantener alineado con los tipos
 * registrados en StatusEffects.
 */
export type AttackType = DamageTypeId

/**
 * Especificación declarativa de UNA fase del patrón.
 * El motor (pickZonesForPhases) la resuelve a DefensePhaseZone.
 */
export interface DefensePhaseSpec {
  /**
   * Cantidad de columnas a sortear dentro del margen.
   * Excluyente con `successColumns`.
   */
  columnCount?: number
  /**
   * Columnas exactas (0-indexadas). Si se define, ignora `columnCount`
   * y se sortean/empatan cero columnas: el patrón es determinístico.
   */
  successColumns?: number[]
  /**
   * Velocidad de la onda para esta fase (columnas/segundo).
   * Si se omite, se hereda del patrón (`DefensePatternConfig.waveSpeed`).
   */
  waveSpeed?: number
}

/**
 * Efecto que se aplica cuando se consigue un bloqueo.
 * Por defecto el bloqueo es una reduccion plana de daño,
 * pero perks/armas pueden cambiarlo a parry, contraataque, reflect, etc.
 */
export type DefenseBlockEffectType =
  | 'damage_reduction'
  | 'parry'
  | 'counter'
  | 'reflect'
  | 'stagger'

export interface DefenseBlockEffect {
  type: DefenseBlockEffectType
  /** Etiqueta legible para logs/UI (ej. "parry", "contraataque", "reduccion de daño"). */
  label: string
  /** Metadata libre (ej. fraccion de contraataque, fraccion reflejada). */
  metadata?: Record<string, number | string>
}

export const DEFENSE_BAR_WIDTH = 30
export const DEFENSE_PHASE_TIMEOUT_MS = 5000
export const DEFAULT_WAVE_SPEED = 30
export const DEFAULT_SUCCESS_ZONE_SIZE = 0.1

export const DEFAULT_BLOCK_EFFECT: DefenseBlockEffect = {
  type: 'damage_reduction',
  label: 'reduccion de daño'
}

export interface DefensePatternConfig {
  name?: string
  /** Tipo elemental del ataque. */
  type?: AttackType
  /** Tipo de daño para escalado: físico usa body, mágico usa mind. Default: 'physical' */
  damageType?: DamageTypeId | string
  waveSpeed?: number
  /**
   * Tamaño por defecto de la zona de éxito en floats [0..1].
   * Si `phases` está definido, se ignora.
   */
  baseSuccessZoneSize?: number
  baseMaxBlockReduction: number
  damageMultiplier: number
  seed?: number
  /**
   * Specs de zona por fase. La cantidad de fases del patrón se
   * deriva de `phases.length`.
   * Si se omite, se sortea con `baseSuccessZoneSize` redondeado
   * a columnas enteras (modo retrocompatible, 1 fase).
   */
  phases?: DefensePhaseSpec[]
  onFailureEffect?: DefenseFailureEffect
  /**
   * Override opcional del VFX de impacto que se muestra sobre el heroe
   * cuando una fase del desafio de defensa falla (sin importar si la
   * fase cae por timeout o por posicion incorrecta). Ver `DefenseFailureVfxConfig`.
   */
  onFailureVfx?: DefenseFailureVfxConfig
  /**
   * Efecto de bloqueo por defecto de este patron.
   * Se aplica si ningun modifier lo sobreescribe.
   */
  onBlockEffect?: DefenseBlockEffect
  /**
   * Alcance del ataque. Por ahora solo se usa 'single' (default).
   * Futuros: 'all' (pega a todos los heroes), 'aoe' (subconjunto por radio).
   * La maquinaria de modifiers ya recibe el target correcto via useCombat,
   * por lo que cuando se implemente AoE solo hay que iterar la lista de heroes.
   */
  targetType?: 'single' | 'all' | 'aoe'
  /**
   * Si esta definido, el enemigo que use este patron hara un ataque
   * multi-heroe: tras resolver la defensa contra el target principal,
   * golpea a 1-3 heroes adicionales al azar con daño reducido.
   * La cantidad real se sortea uniformemente entre [minExtraTargets, maxExtraTargets]
   * y se clampea al numero de heroes vivos restantes (excluyendo al principal).
   * El daño a cada extra es `enemy.attack() * damageMultiplier` (sin critico).
   */
  multiHeroAttack?: {
    minExtraTargets: number
    maxExtraTargets: number
    /** Multiplicador de daño aplicado a cada objetivo extra (default 0.5). */
    damageMultiplier: number
  }
  /**
   * Path a un SFX custom (ej. `/assets/sounds/Battle_SFX/swing.wav`) que
   * se reproduce cuando el enemigo lanza este patron, en lugar del
   * fallback `playAttackSound()`. Si se omite, se usa el fallback.
   */
  customSound?: string
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

export function clampSuccessZoneSize(size: number): number {
  if (size < 0) return 0
  if (size > 0.5) return 0.5
  return size
}
