import type { ICharacter } from './ICharacter'

export type StatusEffectSide = 'enemy' | 'player'
export type DefenseEffectSide = 'player' | 'enemy'

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