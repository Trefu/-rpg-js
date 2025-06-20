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
} 