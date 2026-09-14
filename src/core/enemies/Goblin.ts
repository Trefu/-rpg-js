import { Enemy } from './Enemy'
import goblinSprite from '@/assets/sprites/enemies/goblin.png'
import type { ICharacter } from '../interfaces/ICharacter'
import type { DefensePatternConfig } from '../defense/types'
import { FLASH, SLASH, DEEP_SLASH, TRIPLE_COMBO } from '../abilities/EnemyAttacks'

export class Goblin extends Enemy {
  public readonly sprite = goblinSprite
  public attackPatterns: DefensePatternConfig[] = [SLASH, DEEP_SLASH, FLASH, TRIPLE_COMBO]

  constructor(level: number = 1) {
    super({
      id: `goblin-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Goblin',
      level,
      maxHealth: 70 + (level * 10),
      experienceReward: 20 + (level * 5),
      goldReward: { min: 10 + (level * 2), max: 15 + (level * 3) },
      classMultipliers: { agility: 0.9 },
      enrageThreshold: 30
    })
  }

  /**
   * Prioriza `SLASH` (Espadazo) con un 70% de probabilidad fija cuando
   * el target NO esta ya cegado; el 30% restante cae al pool completo
   * (incluye FLASH). Si el heroe ya sufrio el destello recientemente,
   * cae al random base — re-aplicar solo refresca duracion sin valor
   * tactico adicional.
   */
  public override selectAttackPattern(player: ICharacter | null): DefensePatternConfig {
    const isBlinded = !!player?.hasStatusEffect('blinded')
    if (!isBlinded && Math.random() < 0.70) {
      return SLASH
    }
    return this.attackPatterns[Math.floor(Math.random() * this.attackPatterns.length)]
  }
}