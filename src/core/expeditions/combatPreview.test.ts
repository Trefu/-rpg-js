import { afterEach, describe, expect, it, vi } from 'vitest'
import { getCombatRewardPreview } from './combatPreview'
import { resolveEncounterById } from './encounters'
import { MOUNTAIN_PEAK } from './mountainPeak'

afterEach(() => vi.restoreAllMocks())

describe('recompensas de la vista previa', () => {
  it('muestra XP por héroe y límites de oro sin tirar el botín ni modificar enemigos', () => {
    const enemies = resolveEncounterById(MOUNTAIN_PEAK, 'pass-captain')
    const snapshot = enemies.map(enemy => ({ health: enemy.health, isAlive: enemy.isAlive }))
    const rolls = enemies.map(enemy => vi.spyOn(enemy, 'getRewards'))
    const random = vi.spyOn(Math, 'random')
    const expected = {
      experience: enemies.reduce((sum, enemy) => sum + enemy.experienceReward, 0),
      minGold: enemies.reduce((sum, enemy) => sum + enemy.goldReward.min, 0),
      maxGold: enemies.reduce((sum, enemy) => sum + enemy.goldReward.max, 0)
    }
    expect(getCombatRewardPreview(enemies)).toEqual(expected)
    expect(getCombatRewardPreview(enemies)).toEqual(expected)
    expect(random).not.toHaveBeenCalled()
    for (const roll of rolls) expect(roll).not.toHaveBeenCalled()
    expect(enemies.map(enemy => ({ health: enemy.health, isAlive: enemy.isAlive }))).toEqual(snapshot)
    vi.restoreAllMocks()
    for (let i = 0; i < 20; i++) {
      const actualGold = enemies.reduce((sum, enemy) => sum + enemy.getRewards().gold, 0)
      expect(actualGold).toBeGreaterThanOrEqual(expected.minGold)
      expect(actualGold).toBeLessThanOrEqual(expected.maxGold)
    }
  })
})
