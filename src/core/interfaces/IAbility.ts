import type { ICharacter } from './ICharacter'

export type TimingResult = 'perfect' | 'good' | 'bad' | 'miss'

export interface AbilityContext {
  caster: ICharacter
  target: ICharacter
  addToLog: (message: string) => void
  showEnemyHit: (id: string, value: number) => void
  endPlayerTurn: () => void
  performTimingChallenge: () => Promise<TimingResult>
}

export interface IAbility {
  name: string
  description: string
  type: string
  cooldown: number
  execute: (context: AbilityContext) => Promise<void>
} 