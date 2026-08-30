import type { ICharacter } from './ICharacter'

export type StatusEffectSide = 'enemy' | 'player'

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
   * Se invoca cuando el portador bloquea al menos una fraccion del dano
   * (`blockedFraction > 0`). Dentro del hook, decrementar `charges` consume
   * el efecto. Si `charges` baja a 0, el orquestador lo elimina.
   */
  onBlock?: (target: ICharacter, blockedFraction: number) => void
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