import { Enemy } from './Enemy'
import dragonSprite from '@/assets/sprites/enemies/dragon.png'
import type { EnemyAction } from '../interfaces/ICharacter'
import { FIRE_BREATH, DEEP_SLASH, TRIPLE_COMBO, DragonRoar } from '../abilities/EnemyAttacks'

export class Dragon extends Enemy {
  public readonly sprite = dragonSprite
  /**
   * Mix de patrones visuales (FIRE_BREATH, DEEP_SLASH, TRIPLE_COMBO) y
   * el rugido AOE con `mitigatedSplash` (DragonRoar). Antes DragonRoar
   * era una `IAbility` con `aoe: true` que pegaba a TODOS por igual sin
   * defense challenge. Ahora es un `DefensePatternConfig` que elige un
   * target por agro, va por defense challenge, y reparte el 20% del
   * daño mitigado como splash al resto del party.
   */
  public attackPatterns: EnemyAction[] = [FIRE_BREATH, DEEP_SLASH, TRIPLE_COMBO, DragonRoar]

  constructor(level: number = 8) {
    super({
      id: `dragon-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Dragón Ancestral',
      level,
      maxHealth: 460 + (level * 22),
      experienceReward: 100 + (level * 12),
      goldReward: { min: 60 + (level * 6), max: 110 + (level * 7) },
      classMultipliers: { body: 1.4, mind: 1.3, constitution: 1.2, agility: 2.0 },
      enrageThreshold: 25
    })
  }
}
