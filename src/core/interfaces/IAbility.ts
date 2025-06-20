import type { ICharacter } from './ICharacter'

export type TimingResult = 'perfect' | 'good' | 'bad' | 'miss'

export interface AbilityContext {
  caster: ICharacter
  target: ICharacter
  timingResult: TimingResult
  addToLog: (message: string) => void
  showEnemyHit: (id: string, value: number) => void
  endPlayerTurn: () => void
}

export interface IAbility {
  name: string
  description: string
  type: string
  cooldown: number
  execute: (context: AbilityContext) => void
} 