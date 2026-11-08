import { Hero } from '../Hero'
import { RogueBasicAttack, RoguePoisonStrike, RogueBackstab, RogueHaste, RogueUltimate } from '../abilities/Abilities'
import rogueSprite from '@/assets/sprites/heroes/rogue.png'

export class Rogue extends Hero {
  constructor(level: number = 1) {
    super({
      id: `rogue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: 'Pícaro',
      level,
      heroClassId: 'rogue',
      basicAttack: RogueBasicAttack,
      maxHealth: 105,
      maxEnergy: 80,
      agility: { value: 17, growthPerLevel: 4 },
      constitution: { value: 10, growthPerLevel: 3 },
      mind: { value: 10, growthPerLevel: 2 },
      body: { value: 14, growthPerLevel: 5 },
      sprite: rogueSprite
    })
  }

  static createStarter(): Rogue {
    const rogue = new Rogue(1)
    rogue.learnAbility(RoguePoisonStrike)
    rogue.learnAbility(RogueBackstab)
    rogue.learnAbility(RogueHaste)
    rogue.learnAbility(RogueUltimate)
    return rogue
  }
}
