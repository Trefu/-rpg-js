import type { ICharacter } from './ICharacter'
import type { AudioManager } from '../AudioManager'

export type TimingResult = 'critical' | 'bonus' | 'normal' | 'miss'

export interface AbilityContext {
  caster: ICharacter
  target: ICharacter
  addToLog: (message: string) => void
  showEnemyHit: (id: string, value: number) => void
  showAnnouncement: (text: string, variant?: 'info' | 'attack' | 'status' | 'turn' | 'crit', duration?: number) => void
  performTimingChallenge: () => Promise<TimingResult>
  audioManager: AudioManager
  damageMultiplier?: number
  timingResult?: TimingResult
}

export interface IAbility {
  name: string
  description: string
  type: string
  cooldown: number
  damage?: number
  execute: (context: AbilityContext) => Promise<void>
} 