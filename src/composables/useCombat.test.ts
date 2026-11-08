import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCombat } from './useCombat'
import { useGameStore } from '@/stores/game'
import { Rogue } from '@/core/heroes/Rogue'
import { MountainEnemy } from '@/core/enemies/MountainEnemy'
import { StatusEffects } from '@/core/StatusEffects'
import { RogueBasicAttack } from '@/core/abilities/Abilities'
import { AudioManager } from '@/core/AudioManager'

vi.mock('@/core/AudioManager', () => ({
  AudioManager: { getInstance: () => new Proxy({}, { get: () => vi.fn() }) }
}))

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('window', globalThis)
  setActivePinia(createPinia())
  useGameStore().startGame([Rogue.createStarter()])
})
afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('Daño periódico de enemigos en el combate real', () => {
  it('el veneno aplicado por la daga de Dagel causa daño en el siguiente turno del enemigo', async () => {
    const hero = useGameStore().activeHero!
    const enemy = new MountainEnemy('guardian', 3)
    enemy.baseStats.agility.value = 30
    const attack = RogueBasicAttack.execute({
      caster: hero, target: enemy, ability: RogueBasicAttack, animationDelay: 0, energySpent: 0,
      log: vi.fn(), showEnemyHit: vi.fn(), playEnemyVfx: vi.fn(), showPlayerHit: vi.fn(),
      showAnnouncement: vi.fn(), audioManager: AudioManager.getInstance()
    })
    await vi.runAllTimersAsync()
    await attack
    expect(enemy.statusEffects.find(e => e.type === 'poison')?.stacks).toBe(1)
    const before = enemy.health
    const combat = useCombat()
    combat.initializeCombat([enemy])
    await vi.advanceTimersByTimeAsync(1800)
    expect(enemy.health).toBe(before - 1)
    combat.cleanup()
  })

  it.each([StatusEffects.POISON, StatusEffects.BURN, StatusEffects.BLEED, StatusEffects.FREEZE])(
    '$name resta vida al empezar el turno enemigo', async effect => {
      const enemy = new MountainEnemy('scout')
      enemy.baseStats.agility.value = 30
      enemy.addStatusEffect({ ...effect, stacks: 7, turns: 3 })
      const before = enemy.health
      const combat = useCombat()
      combat.initializeCombat([enemy])
      await vi.advanceTimersByTimeAsync(1800)
      expect(enemy.health).toBe(before - 7)
      expect(combat.combatLog.value.some(line => line.includes('causa 7 de daño'))).toBe(true)
      combat.cleanup()
    }
  )

  it('el veneno puede ganar el combate sin que el enemigo muerto seleccione ni ejecute ataques', async () => {
    const enemy = new MountainEnemy('scout')
    enemy.baseStats.agility.value = 30
    enemy.health = 5
    enemy.addStatusEffect({ ...StatusEffects.POISON, stacks: 7 })
    const select = vi.spyOn(enemy, 'selectAttackPattern')
    const onCombatEnd = vi.fn()
    const combat = useCombat({ onCombatEnd })
    combat.initializeCombat([enemy])
    await vi.advanceTimersByTimeAsync(4000)
    expect(enemy.isAlive).toBe(false)
    expect(enemy.health).toBe(0)
    expect(select).not.toHaveBeenCalled()
    expect(onCombatEnd).toHaveBeenCalledWith(true)
    expect(combat.isDefenseActive.value).toBe(false)
    combat.cleanup()
  })

  it('los enemigos aturdidos también sufren veneno durante el turno perdido', async () => {
    const enemy = new MountainEnemy('scout')
    enemy.baseStats.agility.value = 30
    enemy.addStatusEffect({ ...StatusEffects.POISON, stacks: 4, turns: 3 })
    enemy.addStatusEffect({ ...StatusEffects.STUN, turns: 1 })
    const before = enemy.health
    const combat = useCombat()
    combat.initializeCombat([enemy])
    await vi.advanceTimersByTimeAsync(1800)
    expect(enemy.health).toBe(before - 4)
    expect(enemy.statusEffects.find(e => e.type === 'poison')?.turns).toBe(2)
    expect(combat.isDefenseActive.value).toBe(false)
    combat.cleanup()
  })
})
