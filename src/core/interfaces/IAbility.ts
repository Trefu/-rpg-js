import type { ICharacter } from './ICharacter'
import type { AudioManager } from '../AudioManager'
import type { AnnouncementVariant } from '@/composables/useAnnouncer'

export interface AbilityContext {
  caster: ICharacter
  target: ICharacter
  addToLog: (message: string) => void
  showEnemyHit: (id: string, value: number, isCrit?: boolean) => void
  showAnnouncement: (text: string, variant?: AnnouncementVariant, duration?: number) => void
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
 * Categorias de daño de una habilidad. Sirve para:
 * - futuras resistencias/debilidades de enemigos o heroes
 * - UI (icono/etiqueta del tipo de daño en el modal y en los popups de impacto)
 * - balanceo (los buffs de mind escalan el daño magico, los de body el fisico)
 *
 * Si la ability no inflige daño (curas, buffs), dejar el campo en `undefined`.
 */
export type DamageType = 'physical' | 'fire' | 'holy'

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
  execute: (context: AbilityContext) => Promise<void>
}
