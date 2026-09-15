import type { ICharacter } from './ICharacter'

export type StatusEffectSide = 'enemy' | 'player'
export type DefenseEffectSide = 'player' | 'enemy'

/**
 * Categoria que define el ciclo de vida de un efecto de estado. Sirve para
 * que el resto del pipeline (applyFailureEffect, addStatusEffect,
 * reduceStatusEffects, decrementHeroesDefenseDebuffs, UI) decida su
 * comportamiento sin tener que inspeccionar multiples campos sueltos
 * (`stacks`, `charges`, `turns`, `cleanAtTurnStart`, pertenencia a
 * `DOT_STATUS_TYPES`, etc.).
 *
 * - `'turn-based'` (default si se omite): el efecto se gobierna por `turns`,
 *   se decrementa al inicio del turno del portador via `reduceStatusEffects`
 *   y expira cuando `turns <= 0`. Las reaplicaciones solo refrescan la
 *   duracion. No acumula stacks ni cargos. Cubre la mayoria de buffs/debuffs
 *   (strength_boost, weakness, slow, etc.).
 * - `'dot'` (damage-over-time): ademas de tener `turns`, acumula `stacks`
 *   con dano por turno (`damagePerTurn`). Las reaplicaciones suman stacks
 *   (no refrescan turnos). Tick se aplica al inicio del turno del portador.
 *   Cubre burn/poison/freeze/bleed.
 * - `'stack-based'`: el efecto se gobierna exclusivamente por `stacks`.
 *   `turns` se fuerza a `Infinity` al aplicar (no expira por tiempo).
 *   Las reaplicaciones sobre un target ya activo se suprimen (no suman
 *   stacks). La unica via de limpieza es que un consumidor externo
 *   (ej. `useCombat.consumeRootedStack`) decremente stacks hasta 0.
 *   Cubre ROOTED.
 * - `'charge-based'`: el efecto se gobierna por `charges`/`maxCharges`,
 *   consumidos por hooks externos (tipicamente `onBlock`). `turns` se
 *   fuerza a `Infinity`. Las reaplicaciones refrescan cargas al maximo
 *   (no acumulan). Cubre SECOND_WIND, SPELL_REFLECT.
 */
export type StatusEffectCategory =
  | 'turn-based'
  | 'dot'
  | 'stack-based'
  | 'charge-based'

/**
 * Categorias que NO deben decrementar `turns` al inicio del turno del
 * portador ni al final del turno enemigo. Sus lifecycles dependen de
 * `stacks` o `charges`, no de `turns`.
 */
export const NON_TURN_BASED_CATEGORIES: ReadonlySet<StatusEffectCategory> = new Set([
  'stack-based',
  'charge-based'
])

/**
 * Categorias cuyas reaplicaciones suman `stacks` (en vez de refrescar
 * `turns`). DoT suma stacks hasta `maxStacks`; stack-based suma stacks
 * pero la re-aplicacion se suprime si el target ya esta activo (ver
 * `applyFailureEffect`).
 */
export const STACK_MERGING_CATEGORIES: ReadonlySet<StatusEffectCategory> = new Set([
  'dot',
  'stack-based'
])

/**
 * Payload del popup flotante disparado por un `onBlock` (o cualquier hook de
 * efecto de estado). Se reusa el mismo sistema de popups del jugador para
 * que las autocuraciones / auto-restauraciones de energia de los buffs
 * muestren el numero verde sin tener que tocar el orquestador de combate.
 */
export interface StatusEffectPopupOptions {
  /** Sufijo legible mostrado tras el numero (ej. 'HP', 'EN'). Default: ''. */
  suffix?: string
  isCrit?: boolean
  variant?: 'damage' | 'crit' | 'blocked' | 'heal' | 'energy'
}

/**
 * Hooks que el orquestador de combate inyecta en los callbacks de los
 * efectos de estado (`onBlock`, y a futuro `onTurnEnd`, etc.). Permite que
 * cualquier buff/disparo defina su propio popup sin acoplarse a
 * `useCombat` directamente.
 */
export interface StatusEffectHooks {
  showPlayerHit: (
    value: number,
    options?: { heroId?: string | null; isCrit?: boolean; variant?: StatusEffectPopupOptions['variant']; suffix?: string }
  ) => void
}

/**
 * Contribucion declarativa al sistema de modificadores de defensa.
 * Se invoca una vez por efecto activo (`turns > 0`) durante el calculo de
 * `getDefenseModifiers` (modifiers.ts). El objeto retornado se SUMA a los
 * modifiers actuales — no se sobreescriben.
 *
 * Definir esto junto al template del efecto (en `StatusEffects.ts`) evita
 * tours de codigo entre `StatusEffects.ts` y `modifiers.ts`: agregar un
 * nuevo efecto con impacto defensivo solo requiere tocar su declaracion.
 *
 * El parametro `side` permite que el efecto module su signo segun quien
 * lo porte (ej. INJURED acelera la onda en jugadores pero la desacelera
 * en enemigos).
 */
export interface DefenseContribution {
  /** Delta a sumar al multiplier de velocidad de la onda. */
  waveSpeedMultiplier?: number
  /** Delta a sumar al tamano de la zona de exito (en fraccion de la barra, ej. -0.03 = -3%). */
  successZoneSizeBonus?: number
  /** Delta a sumar al bonus de reduccion de bloqueo. */
  blockReductionBonus?: number
  /**
   * Delta aditivo al multiplicador de daño saliente del portador.
   * Ej. `+0.25` sobre el base `1.0` → final `1.25` (caster hace +25% daño).
   * Aplicado en `getOutgoingDamageMultiplier` (combat/damageModifiers.ts).
   */
  attackDamageMultiplier?: number
  /**
   * Delta aditivo al multiplicador de daño entrante del portador.
   * Ej. `+0.25` sobre el base `1.0` → final `1.25` (target recibe +25% daño).
   * Aplicado en `getIncomingDamageMultiplier` (combat/damageModifiers.ts).
   */
  damageTakenMultiplier?: number
  /**
   * Reduccion de dano entrante POR TIPO (en fraccion: 0.4 = -40% dano de ese tipo).
   * Si multiples efectos aportan resistencia al mismo tipo, se suman y se
   * clampean al MAX_PER_TYPE_RESISTANCE definido en damageModifiers.ts.
   */
  damageTypeResistances?: Partial<Record<import('../combat/damageTypes').DamageTypeId, number>>
}

export type DefenseContributionFn = (
  effect: IStatusEffect,
  side: DefenseEffectSide
) => DefenseContribution | undefined

/**
 * Contribucion reutilizable para efectos con `speedPenalty` negativo.
 * Aplicada por SLOW y FREEZE. La logica vive aca (no en modifiers.ts)
 * para mantener el contrato `defenseContribution` self-contained.
 */
export const speedPenaltyDefenseContribution: DefenseContributionFn = (effect) => {
  if (typeof effect.speedPenalty === 'number' && effect.speedPenalty < 0) {
    return { waveSpeedMultiplier: Math.abs(effect.speedPenalty) * 0.08 }
  }
  return undefined
}

export interface IStatusEffect {
  type: string
  name: string
  description: string
  /**
   * Categoria que define el ciclo de vida del efecto. Ver
   * `StatusEffectCategory` para el detalle de cada categoria. Si se omite,
   * se infiere `'turn-based'` (comportamiento historico).
   *
   * La inferencia automatica se hace en `getEffectCategory()`: si el
   * efecto tiene `charges` se trata como `'charge-based'`; si pertenece
   * a `DOT_STATUS_TYPES` (burn/poison/freeze/bleed) se trata como
   * `'dot'`; si pertenece a `STACKABLE_NON_DOT_STATUS_TYPES` (rooted)
   * se trata como `'stack-based'`; en cualquier otro caso,
   * `'turn-based'`.
   */
  category?: StatusEffectCategory
  /**
   * Descripcion alternativa cuando el portador del efecto es un enemigo.
   * Si esta definida, la UI que muestra efectos sobre enemigos la usa en
   * lugar de `description`. Pensado para efectos cuyo impacto difiere
   * segun el bando (ej. "Lesionado" reduce la onda en enemigos y la
   * acelera en jugadores).
   */
  descriptionOnEnemy?: string
  /**
   * Descripcion alternativa cuando el portador del efecto es el jugador
   * (o un heroe aliado). Si esta definida, se usa en lugar de `description`.
   */
  descriptionOnPlayer?: string
  turns: number
  icon: string
  isBuff?: boolean
  turnLabel?: string
  announceOnTurn?: boolean
  onApply?: (target: ICharacter) => void
  onRemove?: (target: ICharacter) => void
  damagePerTurn?: number
  stacks?: number
  maxStacks?: number
  maxDuration?: number
  defenseBonus?: number
  speedBonus?: number
  speedPenalty?: number
  /**
   * Impacto sobre la velocidad de la onda en la barra de defensa del portador.
   * Se SUMA al `waveSpeedMultiplier` en `getDefenseModifiers`.
   * La dirección del efecto (acelera vs. desacelera) la decide el bando del
   * portador (en jugadores se invierte la onda → más difícil bloquear).
   */
  defenseWaveSpeedImpact?: number
  /**
   * Cargas consumibles. Si esta presente, el efecto se elimina al llegar a 0
   * tras disparar `onBlock`. Independiente de `stacks` (que acumula magnitud).
   * Si no se define, el efecto se gobierna solo por `turns`.
   *
   * Cuando esta presente, `turns` se ignora (el efecto nunca expira por turnos).
   */
  charges?: number
  /**
   * Cargas iniciales con las que se aplico el efecto. Se usa en la UI para
   * mostrar el progreso (`charges / maxCharges`). Si no se define, no se
   * muestra barra de progreso de cargas.
   */
  maxCharges?: number
  /**
   * Daño restante que el escudo absorbe antes de reducir HP del portador.
   * Implementado en `Character.takeDamage`: se consume primero, y solo el
   * excedente reduce HP. Cuando llega a 0, el efecto se elimina.
   *
   * Si esta presente, el efecto funciona como escudo (cargas de daño
   * absorbible, no de triggers como `charges`). Compatible con `turns`
   * (si no recibe daño, expira por turnos normalmente).
   *
   * Bloque D Tier 3 — efecto `arcane_shield`.
   */
  absorbRemaining?: number
  /**
   * Valor inicial de `absorbRemaining`. Se usa en la UI para mostrar
   * el progreso (`absorbRemaining / maxAbsorb`). Opcional.
   */
  maxAbsorb?: number
  /**
   * Se invoca cuando el portador bloquea al menos una fraccion del dano
   * (`blockedFraction > 0`). Dentro del hook, decrementar `charges` consume
   * el efecto. Si `charges` baja a 0, el orquestador lo elimina.
   *
   * El tercer parametro `hooks` expone utilidades de UI (popups flotantes)
   * para que las autocuraciones / auto-restauraciones de buffs muestren
   * el numero sin acoplarse a `useCombat`. Es opcional para mantener
   * compatibilidad con hooks definidos antes de la extension.
   */
  onBlock?: (target: ICharacter, blockedFraction: number, hooks?: StatusEffectHooks) => void
  /**
   * Contribucion al pool de modificadores de defensa. Ver `DefenseContributionFn`.
   * Si esta presente, `getDefenseModifiers` la invoca una vez por turno activo.
   */
  defenseContribution?: DefenseContributionFn
  /**
   * Bonus que se suma al puntaje de targeting del portador cuando el efecto
   * esta activo (turns > 0 / charges > 0). Aplicado por `Enemy.scoreTarget`
   * sobre heroes: cuanto mayor, mas probable es que el enemigo los elija.
   * Pensado para buffs que el jugador quiere mantener activos (ej. Second Wind).
   */
  threatModifier?: number
  /**
   * Imagen (URL) que el `DefenseChallenge` muestra superpuesta a la barra
   * de defensa mientras este efecto esta activo sobre el heroe que defiende.
   * La imagen se adapta al ancho de la barra (objet-fit: contain) para
   * funcionar en distintas resoluciones.
   *
   * Pensado para CC suaves que afectan el desafio de defensa sin skipear
   * el turno (ej. `rooted`: el heroe puede atacar pero no puede bloquear).
   */
  defenseOverlay?: string
  /**
   * Si `false`, este efecto NO se decrementa/remueve al inicio del turno
   * de su portador via `reduceStatusEffects`. Pensado para debuffs que
   * modulan la defensa (ROOTED, BLINDED, CLOUDED) y deben sobrevivir
   * el turno del heroe para poder afectar el proximo desafio de defensa.
   *
   * Default: `true` (comportamiento actual, DoTs y demas).
   */
  cleanAtTurnStart?: boolean
}

/**
 * Resuelve la descripcion que debe mostrarse para un efecto segun el bando
 * del portador. Si no hay override por lado, cae a `description`.
 */
export function getEffectDescription(
  effect: IStatusEffect,
  side: StatusEffectSide
): string {
  if (side === 'enemy' && effect.descriptionOnEnemy) return effect.descriptionOnEnemy
  if (side === 'player' && effect.descriptionOnPlayer) return effect.descriptionOnPlayer
  return effect.description
}

/**
 * Resuelve la categoria de un efecto. Prioridad:
 *  1. `effect.category` (campo explicito en el template).
 *  2. Inferencia por campos/setas si el campo esta ausente.
 *  3. Default: `'turn-based'`.
 *
 * La inferencia mantiene compatibilidad hacia atras: efectos definidos
 * sin `category` siguen comportandose como antes (DoT si esta en
 * DOT_STATUS_TYPES, stack-based si esta en STACKABLE_NON_DOT_STATUS_TYPES,
 * charge-based si tiene `typeof charges === 'number'`, etc.).
 *
 * Nota: el parametro `dotTypes` y `stackableNonDotTypes` son opcionales
 * para evitar una dependencia circular con `StatusEffects.ts`. Si se
 * omiten, la inferencia se reduce a `typeof charges === 'number'` vs
 * default 'turn-based'.
 */
export function getEffectCategory(
  effect: Pick<IStatusEffect, 'category' | 'type' | 'charges'>,
  dotTypes?: ReadonlySet<string>,
  stackableNonDotTypes?: ReadonlySet<string>
): StatusEffectCategory {
  if (effect.category) return effect.category
  if (typeof effect.charges === 'number') return 'charge-based'
  if (dotTypes?.has(effect.type)) return 'dot'
  if (stackableNonDotTypes?.has(effect.type)) return 'stack-based'
  return 'turn-based'
}