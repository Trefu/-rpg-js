import type { ICharacter } from './ICharacter'

export interface IStatusEffect {
  type: string
  name: string
  description: string
  turns: number
  icon: string
  isBuff?: boolean
  turnLabel?: string
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