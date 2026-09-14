import { Enemy } from './Enemy'
import goblinArcherSprite from '@/assets/sprites/enemies/goblin-archer.png'
import type { ICharacter } from '../interfaces/ICharacter'
import type { DefensePatternConfig } from '../defense/types'
import { ENTANGLE, FLASH, POISON_ARROW } from '../abilities/EnemyAttacks'

export class GoblinArcher extends Enemy {
  public readonly sprite = goblinArcherSprite
  public attackPatterns: DefensePatternConfig[] = [POISON_ARROW, ENTANGLE, FLASH]

  constructor(level: number = 1) {
    super({
      id: `goblin-archer-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Goblin Arquero',
      level,
      maxHealth: 40 + (level * 8),
      experienceReward: 22 + (level * 5),
      goldReward: { min: 12 + (level * 2), max: 18 + (level * 3) },
      classMultipliers: { agility: 1.1, mind: 1.1 }
    })
  }

  /**
   * Prioriza `FLASH` con un 35% de probabilidad cuando el target NO
   * esta ya cegado. El arquero es a distancia y se beneficia
   * especialmente de cegar al heroe antes de soltar `POISON_ARROW` o
   * `ENTANGLE`, ya que ambos dependen de un bloqueo exitoso.
   */
  public override selectAttackPattern(player: ICharacter | null): DefensePatternConfig {
    const isBlinded = !!player?.hasStatusEffect('blinded')
    if (!isBlinded && Math.random() < 0.35) {
      return FLASH
    }
    return this.attackPatterns[Math.floor(Math.random() * this.attackPatterns.length)]
  }
}