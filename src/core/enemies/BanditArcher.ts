import { Enemy } from './Enemy'
import banditArcherSprite from '@/assets/sprites/enemies/bandit-archer.png'
import type { ICharacter } from '../interfaces/ICharacter'
import type { DefensePatternConfig } from '../defense/types'
import { ENTANGLE, FLASH, GUST_OF_FOG, POISON_ARROW, TRIPLE_ARROW } from '../abilities/EnemyAttacks'

export class BanditArcher extends Enemy {
  public readonly sprite = banditArcherSprite
  public attackPatterns: DefensePatternConfig[] = [POISON_ARROW, ENTANGLE, GUST_OF_FOG, TRIPLE_ARROW]

  constructor(level: number = 1) {
    super({
      id: `bandit-archer-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Bandido Arquero',
      level,
      maxHealth: 55 + (level * 7),
      experienceReward: 20 + (level * 4),
      goldReward: { min: 16 + (level * 3), max: 26 + (level * 4) },
      classMultipliers: { agility: 1.3, mind: 1.1 }
    })
  }

  /**
   * Prioriza `FLASH` con un 30% de probabilidad cuando el target NO
   * esta ya cegado. El arquero tiene 4 patrones y la mitad son CC
   * (ENTANGLE / GUST_OF_FOG / FLASH), asi que cegar es la apertura
   * para encadenar el resto.
   */
  public override selectAttackPattern(player: ICharacter | null): DefensePatternConfig {
    const isBlinded = !!player?.hasStatusEffect('blinded')
    const isClouded = !!player?.hasStatusEffect('clouded')
    if (!isBlinded && Math.random() < 0.30) {
      return FLASH
    }
    if (!isClouded && Math.random() < 0.25) {
      return GUST_OF_FOG
    }
    return this.attackPatterns[Math.floor(Math.random() * this.attackPatterns.length)]
  }
}