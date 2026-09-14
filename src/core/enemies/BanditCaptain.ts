import { Enemy } from './Enemy'
import banditCaptainSprite from '@/assets/sprites/enemies/bandit-captain.png'
import type { ICharacter } from '../interfaces/ICharacter'
import type { DefensePatternConfig } from '../defense/types'
import { CRUSHING_BLOW, ENTANGLE, FLASH, GUST_OF_FOG, SLASH } from '../abilities/EnemyAttacks'

export class BanditCaptain extends Enemy {
  public readonly sprite = banditCaptainSprite
  public attackPatterns: DefensePatternConfig[] = [CRUSHING_BLOW, SLASH, ENTANGLE, GUST_OF_FOG, FLASH]

  constructor(level: number = 1) {
    super({
      id: `bandit-captain-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Capitán Bandido',
      level,
      maxHealth: 110 + (level * 18),
      experienceReward: 45 + (level * 8),
      goldReward: { min: 35 + (level * 5), max: 55 + (level * 7) },
      classMultipliers: { body: 1.3, constitution: 1.3, agility: 0.7 }
    })
  }

  /**
   * El capitan prioriza CC cuando el target esta sano (HP > 70%) y
   * presiona con daño directo cuando esta herido. La cadena de CC
   * (FLASH → ENTANGLE/GUST_OF_FOG → SLASH/CRUSHING_BLOW) es el
   * "combo" caracteristico: cegar abre, enraizar/nublar mantiene,
   * y los patrones pesados cierran contra un heroe ya desarmado.
   *
   * Prioridades (probabilidades fijas, primera que dispare gana):
   *  1. `FLASH` (40%) si HP > 70% y NO esta cegado.
   *  2. `FLASH` (25%) si HP > 70% y SI esta cegado — forzamos
   *     el refresh si la ventana de oportunidad sigue abierta.
   *  3. Random base entre los 5 patrones disponibles.
   *
   * Por que forzar el refresh cuando ya esta cegado pero el heroe
   * sigue sano: el captain es lento (agility 0.7) y necesita alargar
   * el control para que sus golpes pesados conecten. Si el heroe
   * ya esta bajo de HP, el daño directo es mejor que refrescar CC.
   */
  public override selectAttackPattern(player: ICharacter | null): DefensePatternConfig {
    if (player && player.health > player.maxHealth * 0.7) {
      const isBlinded = !!player.hasStatusEffect('blinded')
      if (!isBlinded && Math.random() < 0.40) {
        return FLASH
      }
      if (isBlinded && Math.random() < 0.25) {
        return FLASH
      }
    }
    return this.attackPatterns[Math.floor(Math.random() * this.attackPatterns.length)]
  }
}