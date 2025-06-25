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
  onTurnEnd?: (target: ICharacter) => void
  onRemove?: (target: ICharacter) => void
  // Propiedades para efectos de daño por tiempo
  damagePerTurn?: number
  // Propiedades para modificaciones de estadísticas
  attackBonus?: number
  defenseBonus?: number
  magicBonus?: number
  speedBonus?: number
  attackPenalty?: number
  defensePenalty?: number
  magicPenalty?: number
  speedPenalty?: number
} 