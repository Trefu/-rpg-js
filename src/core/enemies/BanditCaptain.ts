import { Enemy } from './Enemy'
import banditCaptainSprite from '@/assets/sprites/enemies/bandit-captain.png'
import type { ICharacter } from '../interfaces/ICharacter'
import type { DefensePatternConfig } from '../defense/types'
import { CRUSHING_BLOW, ENTANGLE, FLASH, GUST_OF_FOG, SLASH, TRIPLE_COMBO } from '../abilities/EnemyAttacks'

export class BanditCaptain extends Enemy {
    public readonly sprite = banditCaptainSprite
    public attackPatterns: DefensePatternConfig[] = [CRUSHING_BLOW, SLASH, ENTANGLE, GUST_OF_FOG, FLASH, TRIPLE_COMBO]

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

    public override selectAttackPattern(player: ICharacter | null): DefensePatternConfig {
        if (player && player.health > player.maxHealth * 0.7) {
            const isBlinded = !!player.hasStatusEffect('blinded')
            const isClouded = !!player.hasStatusEffect('clouded')
            if (!isBlinded && Math.random() < 0.40) {
                return FLASH
            }
            if (!isClouded && Math.random() < 0.40) {
                return GUST_OF_FOG
            }
        }
        return this.attackPatterns[Math.floor(Math.random() * this.attackPatterns.length)]
    }
}