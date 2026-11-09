import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCombat } from './useCombat'
import { useGameStore } from '@/stores/game'
import { Rogue } from '@/core/heroes/Rogue'
import { MountainEnemy } from '@/core/enemies/mountainPeak/MountainEnemy'
import { StatusEffects } from '@/core/StatusEffects'
import { RogueBasicAttack, ClericDivineBlessing } from '@/core/abilities/Abilities'
import { AudioManager } from '@/core/AudioManager'
import { Warrior } from '@/core/heroes/Warrior'
import { Cleric } from '@/core/heroes/Cleric'
import { BOMB_SHRAPNEL, DRAGON_BREATH, MOUNTAIN_STAB } from '@/core/abilities/MountainActions'
import type { DefensePatternConfig, DefensePhaseOutcome } from '@/core/defense/types'

vi.mock('@/core/AudioManager', () => ({
  AudioManager: { getInstance: () => new Proxy({}, { get: () => vi.fn() }) }
}))

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('window', globalThis)
  setActivePinia(createPinia())
  useGameStore().startGame([Rogue.createStarter()])
})

describe('Efectos de ataques enemigos de área', () => {
  it('rechaza seleccionar un aliado con escudo divino sin gastar energía ni turno', async () => {
    const game = useGameStore()
    game.startGame([Cleric.createStarter(), Warrior.createStarter()])
    const [cleric, ally] = game.activeHeroes
    cleric.baseStats.agility.value = 1000
    ally.addStatusEffect({ ...StatusEffects.DIVINE_PROTECTION, absorbRemaining: 42 })
    const enemy = new MountainEnemy('scout')
    enemy.baseStats.agility.value = 1
    const combat = useCombat()
    try {
      combat.initializeCombat([enemy])
      await vi.advanceTimersByTimeAsync(1800)
      combat.selectAbility(ClericDivineBlessing, 2)
      expect(combat.isSelectingTarget.value).toBe(true)
      const energy = cleric.energy
      combat.selectAlly(ally)
      expect(cleric.energy).toBe(energy)
      expect(combat.isSelectingTarget.value).toBe(true)
      expect(combat.isPlayerTurn.value).toBe(true)
      expect(ally.statusEffects.find(e => e.type === 'divine_protection')?.absorbRemaining).toBe(42)
    } finally { combat.cleanup() }
  })

  async function setup(pattern: DefensePatternConfig) {
    const game = useGameStore()
    game.startGame([Warrior.createStarter(), Cleric.createStarter(), Rogue.createStarter()])
    for (const hero of game.activeHeroes) {
      hero.maxHealth = 10000
      hero.health = 10000
      hero.baseStats.agility.value = 1
    }
    const enemy = new MountainEnemy('bomber')
    enemy.baseStats.agility.value = 1000
    vi.spyOn(enemy, 'selectAttackPattern').mockReturnValue(pattern)
    vi.spyOn(enemy, 'calculatePhaseDamage').mockReturnValue(100)
    vi.spyOn(enemy, 'rollCrit').mockReturnValue({ multiplier: 1, isCrit: false, isOvercrit: false })
    const combat = useCombat({ enemyAttackAnnouncementMs: 0 })
    combat.initializeCombat([enemy])
    await vi.advanceTimersByTimeAsync(1800)
    expect(combat.isDefenseActive.value).toBe(true)
    return { combat, heroes: game.activeHeroes }
  }

  it.each([BOMB_SHRAPNEL, DRAGON_BREATH])('$name aplica su DoT a todo el grupo por cada fase fallida', async pattern => {
    const { combat, heroes } = await setup(pattern)
    try {
      for (let phase = 1; phase <= 2; phase++) {
        await combat.handleDefensePhaseComplete({ outcome: 'fail', waveColumn: 0, zone: { successColumns: [1], waveSpeed: 30 } })
        for (const hero of heroes) {
          expect(hero.statusEffects.find(e => e.type === pattern.onFailureEffect!.statusType)?.stacks)
            .toBe(pattern.onFailureEffect!.stacks! * phase)
        }
      }
    } finally { combat.cleanup() }
  })

  it.each(['success', 'timeout'] as DefensePhaseOutcome[])('%s: el bloqueo evita el efecto en todos; agotar el tiempo no', async outcome => {
    const { combat, heroes } = await setup(BOMB_SHRAPNEL)
    try {
      await combat.handleDefensePhaseComplete({ outcome, waveColumn: 0, zone: { successColumns: [1], waveSpeed: 30 } })
      for (const hero of heroes) expect(hero.hasStatusEffect('bleed')).toBe(outcome !== 'success')
    } finally { combat.cleanup() }
  })

  it('propaga también debuffs no periódicos sin perder su duración', async () => {
    const { combat, heroes } = await setup({ ...BOMB_SHRAPNEL, onFailureEffect: { statusType: 'injured', maxDuration: 2 } })
    try {
      await combat.handleDefensePhaseComplete({ outcome: 'fail', waveColumn: 0, zone: { successColumns: [1], waveSpeed: 30 } })
      for (const hero of heroes) expect(hero.statusEffects.find(e => e.type === 'injured')?.turns).toBe(2)
    } finally { combat.cleanup() }
  })

  it('no propaga efectos exclusivos del objetivo principal', async () => {
    const { combat, heroes } = await setup({ ...BOMB_SHRAPNEL, mitigatedSplash: { damageMultiplier: 0.15, applyFailureEffect: false } })
    try {
      await combat.handleDefensePhaseComplete({ outcome: 'fail', waveColumn: 0, zone: { successColumns: [1], waveSpeed: 30 } })
      expect(heroes.filter(hero => hero.hasStatusEffect('bleed'))).toHaveLength(1)
      expect(heroes.every(hero => hero.health < hero.maxHealth)).toBe(true)
    } finally { combat.cleanup() }
  })

  it('los ataques individuales siguen afectando únicamente al objetivo principal', async () => {
    const { combat, heroes } = await setup({ ...MOUNTAIN_STAB, onFailureEffect: { statusType: 'bleed', stacks: 2 } })
    try {
      await combat.handleDefensePhaseComplete({ outcome: 'fail', waveColumn: 0, zone: { successColumns: [1], waveSpeed: 30 } })
      expect(heroes.filter(hero => hero.hasStatusEffect('bleed'))).toHaveLength(1)
      expect(heroes.filter(hero => hero.health < hero.maxHealth)).toHaveLength(1)
    } finally { combat.cleanup() }
  })

  it('no aplica estados a héroes muertos por el daño de área', async () => {
    const { combat, heroes } = await setup(BOMB_SHRAPNEL)
    try {
      for (const hero of heroes) hero.health = 1
      await combat.handleDefensePhaseComplete({ outcome: 'fail', waveColumn: 0, zone: { successColumns: [1], waveSpeed: 30 } })
      expect(heroes.every(hero => !hero.isAlive)).toBe(true)
      expect(heroes.every(hero => !hero.hasStatusEffect('bleed'))).toBe(true)
    } finally { combat.cleanup() }
  })
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
