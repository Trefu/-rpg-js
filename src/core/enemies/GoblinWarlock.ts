import { Enemy } from './Enemy'
import goblinWarlockSprite from '@/assets/sprites/enemies/goblin-warlock.png'
import type { ICharacter } from '../interfaces/ICharacter'
import type { DefensePatternConfig } from '../defense/types'
import { EMBER, GUST_OF_FOG} from '../abilities/EnemyAttacks'

export class GoblinWarlock extends Enemy {
  public readonly sprite = goblinWarlockSprite
  public attackPatterns: DefensePatternConfig[] = [EMBER, GUST_OF_FOG]

  constructor(level: number = 1) {
    super({
      id: `goblin-warlock-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Goblin Warlock',
      level,
      maxHealth: 30 + (level * 9),
      experienceReward: 24 + (level * 5),
      goldReward: { min: 14 + (level * 2), max: 20 + (level * 3) },
      // `mind` se setea en baseStats (no via classMultipliers) porque el default
      // es 10 y el multiplier 1.4 -> 14 daba un statBonus magico demasiado bajo:
      // con EMBER (damageMultiplier 0.7) resultaba en finalDamage 0-1 y,
      // bloqueado, siempre 0. Alineamos con el body baseline fisico (22).
      baseStats: {
        mind: { value: 22, growthPerLevel: 0.5 }
      },
      classMultipliers: { agility: 1.1 }
    })
  }

  /**
   * Si el objetivo NO tiene ya el debufo 'clouded', el warlock prioriza
   * `GUST_OF_FOG` con un 50% de probabilidad; el resto del tiempo elige al
   * azar entre todos los patrones disponibles (incluido GUST_OF_FOG).
   * Si el objetivo ya esta nublado, cae al random base para no acumular
   * stacks innecesariamente (la reaplicacion solo refresca duracion).
   */
  public override selectAttackPattern(player: ICharacter | null): DefensePatternConfig {
    const isAlreadyClouded = !!player?.hasStatusEffect('clouded')
    if (!isAlreadyClouded && Math.random() < 0.5) {
      return GUST_OF_FOG
    }
    return super.selectAttackPattern(player)
  }
}
