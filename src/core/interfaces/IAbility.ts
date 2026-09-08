import type { ICharacter } from './ICharacter'
import type { AudioManager } from '../AudioManager'
import type { AnnouncementVariant } from '@/composables/useAnnouncer'

export interface AbilityContext {
  caster: ICharacter
  /**
   * Objetivo seleccionado de la ability. `null` para abilities que se
   * castean sobre todos los enemigos (AOE) o sobre si mismas
   * (`requiresTarget: false`): esas abilities deben ignorar este campo y
   * resolver sus objetivos por su cuenta (típicamente desde
   * `context.caster` o el estado global de combate).
   */
  target: ICharacter | null
  ability?: IAbility
  addToLog: (message: string) => void
  showEnemyHit: (id: string, value: number, isCrit?: boolean) => void
  playEnemyVfx?: (enemyId: string, effect: VfxEffect) => void
  showPlayerHit: (value: number, options?: { heroId?: string | null, isCrit?: boolean, variant?: 'damage' | 'crit' | 'blocked' | 'heal' }) => void
  showAnnouncement: (text: string, variant?: AnnouncementVariant, duration?: number, opts?: { sticky?: boolean; priority?: number; id?: string; interrupt?: boolean }) => void
  audioManager: AudioManager
  /**
   * Duracion del delay post-ejecucion (ms) que la ability debe esperar
   * antes de ceder el turno. Default 1500. Proviene de
   * `IAbility.animationDurationMs` en `useCombat`.
   */
  animationDelay: number
  /**
   * Cantidad de energia que se desconto del caster al validar la accion.
   * Las abilities pueden cobrar este valor en su execute si la mecanica lo requiere.
   */
  energySpent?: number
  /**
   * Escrito por la ability cuando tiene `randomAttack`: daño base del impacto
   * principal SIN multiplicador de critico. Lo usa `useCombat` para calcular
   * el daño de cada objetivo splash como `lastPrimaryBaseDamage * damageMultiplier`.
   */
  lastPrimaryBaseDamage?: number
  /**
   * Escrito por la ability cuando tiene `aoe: true`: daño final (con crit ya
   * aplicado) del impacto principal. `useCombat` lo replica a todos los demas
   * enemigos vivos SIN critico adicional.
   */
  lastPrimaryFinalDamage?: number
}

/**
 * Restringe los objetivos que una habilidad puede seleccionar.
 * - 'all': cualquier objetivo (aliados o enemigos)
 * - 'enemies-only': solo enemigos
 * - 'allies-only': solo aliados (incluye al caster)
 */
export type AbilityTargetType = 'all' | 'enemies-only' | 'allies-only'

/**
 * Spec del componente aleatorio / splash de una habilidad de heroe.
 * Tras golpear al `target` principal se eligen N objetivos adicionales al
 * azar del campo enemigo (excluyendo al primario) y se les aplica daño
 * automaticamente a cada uno: `lastPrimaryBaseDamage * damageMultiplier`.
 * Sin critico en los splashes — solo el impacto principal puede critear.
 */
export interface RandomAttackSpec {
  minExtraTargets: number
  maxExtraTargets: number
  /** Multiplicador de daño sobre el daño base del impacto principal (sin crit). */
  damageMultiplier: number
}

/**
 * Categorias de daño de una habilidad. Re-export del registro central en
 * `core/combat/damageTypes.ts` — ese módulo es la única fuente de verdad
 * para labels, colores, escalado y aliases. Si la ability no inflige
 * daño (curas, buffs), dejar el campo en `undefined`.
 */
export type { DamageTypeId as DamageType } from '../combat/damageTypes'
export {
  DAMAGE_TYPES,
  getDamageTypeLabel,
  getDamageTypeInfo,
  canonicalDamageType,
  type DamageTypeInfo
} from '../combat/damageTypes'

/**
 * @deprecated usa `getDamageTypeLabel(id)` del módulo central. Este map
 * se mantiene solo por compatibilidad transitoria.
 */
export const DAMAGE_TYPE_LABELS: Record<string, string> = {
  physical: 'Físico',
  fire: 'Fuego',
  holy: 'Sagrado',
  frost: 'Agua',
  poison: 'Veneno',
  arcane: 'Arcano',
  electric: 'Eléctrico',
  water: 'Agua',
  shadow: 'Arcano',
  magical: 'Arcano',
  radiant: 'Sagrado'
}

export type VfxAssetId =
  | 'fire-slash-down'
  | 'fire-slash-up'
  | 'holy-slash-down'
  | 'holy-slash-up'
  | 'impact'
  | 'big-hit'

export interface VfxEffect {
  asset: VfxAssetId
  durationMs: number
}

/**
 * Resultado del preview de daño de una ability ofensiva.
 * El modal de habilidades lo muestra como `daño min–daño max` y, al tocarlo,
 * expande una sola línea con la fórmula del daño (valores del caster ya
 * sustituidos). Sin multiplicadores raros ni jargon: legible a primera vista.
 */
export interface AbilityDamagePreview {
  /** Daño mínimo posible (floored) sin critico. */
  min: number
  /** Daño máximo posible (floored) sin critico. */
  max: number
  /**
   * Fórmula del daño con los valores del caster ya sustituidos, en una sola
   * línea legible. Ej. `(14 × 0.7) + 3 = 9.8`.
   */
  formula: string
  /** Tipo de daño legible. `undefined` para abilities sin daño. */
  damageTypeLabel?: string
}

export interface IAbility {
  name: string
  description: string
  type: string
  cooldown: number
  /**
   * Tipo de daño que inflige esta habilidad. `undefined` para habilidades
   * que no causan daño (curas, buffs). Default: `undefined`.
   */
  damageType?: DamageType
  /**
   * Preview del daño para mostrar en el modal de habilidades (estilo LoL).
   * Solo se define en abilities que infligen daño. Las curas/buffs lo omiten.
   */
  previewDamage?: (hero: import('../Hero').Hero) => AbilityDamagePreview
  /**
   * Costo fijo de energia que se cobra antes de ejecutar.
   * Si el caster no tiene suficiente energia, la accion se cancela antes de gastar el turno.
   */
  energyCost?: number
  /** Define a que tipo de personajes puede apuntar esta habilidad. Default: 'enemies-only'. */
  targetType?: AbilityTargetType
  /**
   * Si es `false`, la habilidad se ejecuta inmediatamente al seleccionarla
   * sin pedir un objetivo (se aplica al caster). Usar para auto-buffs/curas
   * que ignoran `context.target`. Default: `true`.
   */
  requiresTarget?: boolean
  /**
   * Tiempo de animacion post-ejecucion (ms), al estilo del tick de DoT del jugador.
   * Controla cuanto permanece visible el resultado antes de pasar al turno enemigo.
   * Default global: 1500 ms.
   */
  animationDurationMs?: number
  hitCount?: number
  hitIntervalMs?: number
  vfx?: VfxEffect | VfxEffect[]
  hitVfx?: VfxEffect | VfxEffect[]
  /**
   * Si esta definido, tras el impacto principal la habilidad salta
   * aleatoriamente a N objetivos extra del campo enemigo.
   * Ver `RandomAttackSpec`.
   */
  randomAttack?: RandomAttackSpec
  /**
   * Si es `true`, tras el impacto principal la habilidad golpea a TODOS los
   * demas enemigos vivos con el mismo daño final (el del impacto principal,
   * ya con crit aplicado) de forma simultanea en un unico tick, sin delays
   * entre objetivos. Sin critico adicional en los splashes.
   * La ability debe escribir `context.lastPrimaryFinalDamage` en su `execute`.
   */
  aoe?: boolean
  /**
   * Path a un SFX custom (ej. `/assets/sounds/Buffs_Heals_SFX/Def_buff.wav`)
   * que se reproduce en lugar del `playAttackSound()` por defecto al ejecutar
   * la habilidad. Si se omite, se usa el fallback `playAttackSound`.
   */
  customSound?: string
  execute: (context: AbilityContext) => Promise<void>
}
