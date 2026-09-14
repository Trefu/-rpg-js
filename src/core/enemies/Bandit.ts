import { Enemy } from './Enemy'
import goblinSprite from '@/assets/sprites/enemies/bandit.png'
import type { ICharacter } from '../interfaces/ICharacter'
import type { DefensePatternConfig } from '../defense/types'
import { FLASH, SLASH, POISON_ARROW } from '../abilities/EnemyAttacks'

export class Bandit extends Enemy {
  public readonly sprite = goblinSprite
  public attackPatterns: DefensePatternConfig[] = [SLASH, POISON_ARROW, FLASH]

  constructor(level: number = 1) {
    super({
      id: `bandit-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Bandido',
      level,
      maxHealth: 55 + (level * 9),
      experienceReward: 18 + (level * 4),
      goldReward: { min: 18 + (level * 3), max: 28 + (level * 4) },
      classMultipliers: { agility: 1.2 }
    })
  }

  /**
   * Prioriza `FLASH` con un 25% de probabilidad cuando el target NO
   * esta ya cegado. Re-aplicar solo refresca duracion, asi que cae
   * al pool completo en ese escenario.
   */
  public override selectAttackPattern(player: ICharacter | null): DefensePatternConfig {
    const isBlinded = !!player?.hasStatusEffect('blinded')
    if (!isBlinded && Math.random() < 0.25) {
      return FLASH
    }
    return this.attackPatterns[Math.floor(Math.random() * this.attackPatterns.length)]
  }
}