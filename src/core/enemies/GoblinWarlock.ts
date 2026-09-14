import { Enemy } from './Enemy'
import goblinWarlockSprite from '@/assets/sprites/enemies/goblin-warlock.png'
import type { ICharacter, EnemyAction } from '../interfaces/ICharacter'
import { EMBER, FLASH, WarlockHex } from '../abilities/EnemyAttacks'

export class GoblinWarlock extends Enemy {
  public readonly sprite = goblinWarlockSprite
  public attackPatterns: EnemyAction[] = [EMBER, WarlockHex, FLASH]

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
   * Prioridades del warlock, en orden de probabilidad (la primera que
   * dispare retorna el patron):
   *  1. `WarlockHex` (35%) si el target NO esta al maximo de Maldicion (5/5).
   *  2. `FLASH` (25%) si el target NO esta ya cegado.
   *  3. Random base entre los tres patrones disponibles.
   *
   * El destello sinergiza con la maldición: el heroe cegado tiene mas
   * dificil bloquear los proximos ataques (incluido EMBER), lo que
   * amplifica el daño sostenido del warlock.
   */
  public override selectAttackPattern(player: ICharacter | null): EnemyAction {
    const curseStacks = player?.statusEffects?.find(e => e.type === 'curse')?.stacks ?? 0
    if (curseStacks < 5 && Math.random() < 0.35) {
      return WarlockHex
    }
    const isBlinded = !!player?.hasStatusEffect('blinded')
    if (!isBlinded && Math.random() < 0.25) {
      return FLASH
    }
    return super.selectAttackPattern(player)
  }
}