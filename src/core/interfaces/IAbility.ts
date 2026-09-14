import type { ICharacter } from './ICharacter'
import type { AudioManager } from '../AudioManager'
import type { AnnouncementVariant } from '@/composables/useAnnouncer'
import type { AbilityTag } from '../abilities/registry'
import type { DamageStep } from '../abilities/damagePipeline'
import type { DamageTypeId } from '../combat/damageTypes'

/** Alias local de `DamageTypeId` para que las abilities lo puedan usar directamente. */
export type DamageType = DamageTypeId

/**
 * Side-effects de UI/SFX/log que una ability puede invocar durante su
 * `execute`. Separado de `AbilityRuntime` (datos puros del cast) para que
 * las abilities sean testeables sin montar `useCombat`: en tests se pasa
 * un mock de `AbilityEffects` con espías en cada callback.
 *
 * Los callbacks `log` y `hit` son nombres cortos (no `addToLog`,
 * `showEnemyHit`) para que las abilities no tengan que importarlos de
 * `useCombat`. `useCombat.executeAbility` mapea los nombres largos a
 * estos cortos al construir el objeto.
 */
export interface AbilityEffects {
  /** Log a un mensaje en el combat log. */
  log: (message: string) => void
  /** Popup de daño sobre un enemigo (id = enemyId). */
  showEnemyHit: (id: string, value: number, isCrit?: boolean) => void
  /** VFX sobre un enemigo (ej: slash, big-hit). */
  playEnemyVfx: (enemyId: string, effect: VfxEffect) => void
  /** VFX sobre un heroe aliado (ej: heal, buff). */
  playHeroVfx?: (heroId: string, effect: VfxEffect) => void
  /** Popup de hit sobre un heroe (daño, crit, bloqueo, heal). */
  showPlayerHit: (
    value: number,
    options?: {
      heroId?: string | null
      isCrit?: boolean
      variant?: 'damage' | 'crit' | 'blocked' | 'heal' | 'energy'
      suffix?: string
    }
  ) => void
  /** Banner central de anuncio (info, crit, status, attack, etc.). */
  showAnnouncement: (
    text: string,
    variant?: AnnouncementVariant,
    duration?: number,
    opts?: { sticky?: boolean; priority?: number; id?: string; interrupt?: boolean }
  ) => void
  /** AudioManager para reproducir SFX. */
  audioManager: AudioManager
  /**
   * Lista de heroes aliados vivos (incluye al caster). Lo inyecta
   * `useCombat.executeAbility` al construir el contexto. Lo usan las
   * habilidades AoE de aliados (curas grupales, purgas, buffs) para
   * iterar sobre el team sin importar el gameStore directamente.
   * Opcional para mantener retro-compatibilidad con tests y contextos
   * enemigos que no tienen un team aliado.
   */
  allies?: ICharacter[]
  /**
   * Output opcional: la ability puede setear esto para que `useCombat`
   * aplique el splash del `randomAttack` sobre objetivos extra.
   */
  lastPrimaryBaseDamage?: number
  /**
   * Output opcional: la ability puede setear esto para que `useCombat`
   * replique el daño del impacto principal a TODOS los enemigos vivos (AOE).
   */
  lastPrimaryFinalDamage?: number
}

/**
 * Datos puros del cast: lo que la ability necesita saber sobre el mundo
 * al momento de ejecutarse. NO contiene callbacks — esos viven en
 * `AbilityEffects`. Esto hace que las abilities sean funciones puras
 * testeables: dado `(runtime, effects) → side-effects`.
 */
export interface AbilityRuntime {
  caster: ICharacter
  /**
   * Objetivo seleccionado de la ability. `null` para abilities que se
   * castean sobre todos los enemigos (AOE) o sobre si mismas
   * (`requiresTarget: false`): esas abilities deben ignorar este campo y
   * resolver sus objetivos por su cuenta (típicamente desde
   * `context.caster` o el estado global de combate).
   */
  target: ICharacter | null
  ability: IAbility
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
  energySpent: number
}

/**
 * Backward-compatible: la firma actual de `execute(context: AbilityContext)`
 * sigue funcionando porque `AbilityContext = AbilityRuntime & AbilityEffects`.
 * Las nuevas abilities pueden usar `execute(runtime, effects)` directamente.
 */
export type AbilityContext = AbilityRuntime & AbilityEffects

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
  /** Multiplicador base para el PRIMER rebote (objetivo adicional #1). */
  damageMultiplier: number
  /**
   * Reduccion adicional aplicada a cada rebote sucesivo.
   * `multiplier[i] = damageMultiplier - i * bounceDamageReductionPerStep`
   * (clamp a 0). Default: `0.05` (5% menos por escalon).
   * Ej. `damageMultiplier: 0.95, bounceDamageReductionPerStep: 0.05` →
   * 1er rebote 95%, 2do 90%, 3ro 85%, ...
   */
  bounceDamageReductionPerStep?: number
}

/**
 * Categorias de daño de una habilidad. Re-export del registro central en
 * `core/combat/damageTypes.ts` — ese módulo es la única fuente de verdad
 * para labels, colores, escalado y aliases. Si la ability no inflige
 * daño (curas, buffs), dejar el campo en `undefined`.
 */
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
  | 'physical-slash-1'
  | 'physical-slash-2'
  | 'physical-slash-3'
  | 'enemy-slash-1'
  | 'enemy-slash-2'
  | 'enemy-slash-3'
  | 'enemy-slash-4'
  | 'enemy-slash-5'
  | 'impact'
  | 'big-hit'
  | 'holy-smite'
  | 'holy-heal'
  | 'holy-light'
  | 'hero-block'

export interface VfxEffect {
  asset: VfxAssetId
  durationMs: number
  /**
   * Si es `true`, la UI debe espejar horizontalmente el GIF al renderizarlo
   * (`transform: scaleX(-1)`). Se usa para VFX cuyo origen visual está en el
   * lado opuesto al del observador (p.ej. ataques enemigos que se muestran
   * sobre la carta del heroe — el slash "viene desde la derecha" del
   * enemigo, pero la carta del heroe lo refleja desde la suya).
   * Default: `false`.
   */
  mirrored?: boolean
  /**
   * Rotación (en grados) aplicada al GIF al renderizarlo. Se usa para que
   * los slashes que se alternan entre frames (up/down) no caigan siempre en
   * el mismo ángulo y cada golpe se sienta distinto. Default: `0`.
   */
  rotationDeg?: number
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
   * Tags opcionales para categorizar la ability (clase, tipo de daño,
   * mecánica). Consumidos por `getAbilitiesByTag` del registry para
   * auto-poblar UIs (training, filtros).
   */
  tags?: AbilityTag[]
  /**
   * Ícono PNG de la ability (import del asset). Co-localizado con la
   * definición para que no haya que mantener un map manual.
   * `getAbilityIcon(type)` lo lee del registry.
   */
  icon?: string
  /**
   * Tipo de daño que inflige esta habilidad. `undefined` para habilidades
   * que no causan daño (curas, buffs). Default: `undefined`.
   */
  damageType?: DamageType
  /**
   * Pipeline declarativo del daño. Si está presente:
   * - `previewDamage` se deriva automáticamente de este pipeline + stats
   *   del caster (ver `previewFromPipeline`).
   * - El `execute` puede usar `dealDamage(...)` que ejecuta el pipeline
   *   (variance → outgoingMult → crit → takeDamage → hit popup → log)
   *   sin tener que reescribirlo en cada ability.
   *
   * Si la ability tiene daño no estándar (ej: heal que escala, damage que
   * depende de un buff dinámico), definir `customPreview` en lugar de
   * `pipeline` y escribir `execute` a mano.
   */
  pipeline?: DamageStep | DamageStep[]
  /**
   * Preview custom. Tiene prioridad sobre el derivado del pipeline cuando
   * está definido. Útil para abilities con mecánica especial de daño
   * (splash, AoE con daño distinto, etc.) que no encajan en un step simple.
   */
  customPreview?: (hero: import('../Hero').Hero) => AbilityDamagePreview
  /**
   * Preview del daño para mostrar en el modal de habilidades (estilo LoL).
   *
   * Si la ability tiene `pipeline` y NO tiene `customPreview`, este campo
   * se rellena automáticamente al registrar (`registry.ts` lo completa
   * llamando a `previewFromPipeline`).
   *
   * Solo se define manualmente para abilities que infligen daño con
   * mecánica no estándar. Las curas/buffs lo omiten.
   */
  previewDamage?: (hero: import('../Hero').Hero) => AbilityDamagePreview
  /**
   * Costo fijo de energia que se cobra antes de ejecutar.
   * Si el caster no tiene suficiente energia, la accion se cancela antes de gastar el turno.
   */
  energyCost?: number
  /**
   * Costo fijo de Heroismo (recurso dorado compartido) que se cobra
   * antes de ejecutar. Se usa para habilidades definitivas que solo
   * pueden lanzarse cuando la barra de Heroismo esta al maximo
   * (coste tipico: 100). Si el caster no alcanza, la accion se cancela
   * antes de gastar el turno (igual que `energyCost`).
   *
   * No se combina con `energyCost`: una ability puede tener uno, otro
   * o ambos, y se validan ambos de forma independiente.
   */
  heroismCost?: number
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
   * Si es `true` (default), la ability se cancela cuando el caster tiene
   * el debuff `silenced`. Poner `false` para abilities que no son
   * "magicas" en sentido estricto (ej. un grito de guerra, un hechizo
   * fisico, un buff de escudo natural) y deberian poder castearse aun
   * estando silenciado. El ataque basico SIEMPRE puede usarse
   * (no pasa por `executeAbility`).
   *
   * Solo aplica al jugador por ahora (la IA enemiga no tiene sistema de
   * habilidades activas — solo patrones de defensa).
   */
  silencable?: boolean
  /**
   * Path a un SFX custom (ej. `/assets/sounds/Buffs_Heals_SFX/Def_buff.wav`)
   * que se reproduce en lugar del `playAttackSound()` por defecto al ejecutar
   * la habilidad. Si se omite, se usa el fallback `playAttackSound`.
   */
  customSound?: string
  execute: (context: AbilityContext) => Promise<void>
}
