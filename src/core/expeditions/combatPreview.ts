import type { IEnemy } from '../interfaces/ICharacter'

/** Read reward bounds without rolling gold or changing encounter state. */
export function getCombatRewardPreview(enemies: readonly Pick<IEnemy, 'experienceReward' | 'goldReward'>[]) {
  return enemies.reduce((total, enemy) => ({
    experience: total.experience + enemy.experienceReward,
    minGold: total.minGold + enemy.goldReward.min,
    maxGold: total.maxGold + enemy.goldReward.max
  }), { experience: 0, minGold: 0, maxGold: 0 })
}
