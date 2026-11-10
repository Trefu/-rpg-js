import { describe, expect, it, vi } from 'vitest'
import { AncestralGuard, MountainMend, AttackOrder, StonePreparation } from './MountainActions'
import { WarlockHex } from './EnemyAttacks'
import { Warrior } from '../heroes/Warrior'
import { MountainEnemy } from '../enemies/mountainPeak/MountainEnemy'
import { StatusEffects } from '../StatusEffects'
import type { AbilityContext, IAbility } from '../interfaces/IAbility'

async function cast(ability: IAbility, caster: MountainEnemy, allies?: MountainEnemy[]) {
  const log = vi.fn()
  await ability.execute({ caster, allies, target: null, ability, animationDelay: 0, energySpent: 0, log } as unknown as AbilityContext)
  return log
}

describe('Apoyos enemigos basados en estadísticas', () => {
  it('reserva las fórmulas para los chips, no las descripciones de habilidades o estados', async () => {
    const caster = new MountainEnemy('shaman')
    for (const ability of [AncestralGuard, MountainMend]) {
      expect(ability.description).not.toMatch(/MEN|×|redondead/)
      expect(ability.previewEffect!(Warrior.createStarter()).formula).toContain('×')
    }
    await cast(AncestralGuard, caster)
    expect(StatusEffects.ANCESTRAL_GUARD.description).not.toMatch(/MEN|×|redondead/)
    expect(caster.statusEffects.find(effect => effect.type === 'ancestral_guard')?.description).not.toMatch(/MEN|×|redondead/)
  })
  it.each([
    [AncestralGuard, 'holy-light'], [MountainMend, 'holy-heal'],
    [AttackOrder, 'haste-aura'], [StonePreparation, 'holy-light']
  ] as const)('%s anima al receptor correcto sin afectar a los muertos', async (ability, asset) => {
    const caster = new MountainEnemy('shaman')
    const ally = new MountainEnemy('guardian')
    const dead = new MountainEnemy('scout')
    ally.health = 1
    dead.isAlive = false
    const playEnemyVfx = vi.fn()
    const playHeroVfx = vi.fn()
    await ability.execute({ caster, allies: [caster, ally, dead], target: null, ability,
      animationDelay: 0, log: vi.fn(), playEnemyVfx, playHeroVfx } as unknown as AbilityContext)
    const recipients = ability === AttackOrder ? [caster.id, ally.id] : [ability === StonePreparation ? caster.id : ally.id]
    expect(playEnemyVfx.mock.calls.map(([id]) => id)).toEqual(recipients)
    for (const [, effect] of playEnemyVfx.mock.calls) expect(effect).toMatchObject({ asset, durationMs: expect.any(Number) })
    expect(playHeroVfx).not.toHaveBeenCalled()
  })

  it('Maldición anima al héroe tanto al aplicarse como al renovarse, nunca a un muerto', async () => {
    const caster = new MountainEnemy('warlock')
    const target = new Warrior()
    const playHeroVfx = vi.fn()
    const playEnemyVfx = vi.fn()
    const context = { caster, target, ability: WarlockHex, animationDelay: 0,
      log: vi.fn(), showAnnouncement: vi.fn(), playHeroVfx, playEnemyVfx } as unknown as AbilityContext
    await WarlockHex.execute(context)
    await WarlockHex.execute(context)
    expect(playHeroVfx).toHaveBeenCalledTimes(2)
    expect(playHeroVfx).toHaveBeenCalledWith(target.id, { asset: 'poison-bomb', durationMs: 900 })
    expect(playEnemyVfx).not.toHaveBeenCalled()
    target.isAlive = false
    await WarlockHex.execute(context)
    expect(playHeroVfx).toHaveBeenCalledTimes(2)
  })
  it.each([[10, 8, 6], [20, 16, 13], [27.5, 22, 17], [40, 32, 26]])(
    'MEN %s determina el escudo y la curación del lanzador', async (mind, shield, heal) => {
      const caster = new MountainEnemy('shaman')
      const ally = new MountainEnemy('guardian')
      caster.baseStats.mind.value = mind
      ally.baseStats.mind.value = 100
      ally.health = 1
      await cast(AncestralGuard, caster, [caster, ally])
      expect(ally.statusEffects.find(effect => effect.type === 'ancestral_guard')).toMatchObject({
        absorbRemaining: shield, maxAbsorb: shield, turns: 2
      })
      await cast(MountainMend, caster, [caster, ally])
      expect(ally.health).toBe(1 + heal)
      ally.takeDamage(shield + 3)
      expect(ally.health).toBe(1 + heal - 3)
      expect(ally.hasStatusEffect('ancestral_guard')).toBe(false)
    }
  )

  it('el crecimiento de MEN por nivel mejora el apoyo sin mutar las plantillas', async () => {
    const low = new MountainEnemy('shaman', 1)
    const high = new MountainEnemy('shaman', 9)
    await cast(AncestralGuard, low)
    await cast(AncestralGuard, high)
    const capacity = (enemy: MountainEnemy) => enemy.statusEffects.find(effect => effect.type === 'ancestral_guard')!.maxAbsorb!
    expect(capacity(high)).toBeGreaterThan(capacity(low))
    expect(capacity(low)).toBe(21)
    expect(StatusEffects.ANCESTRAL_GUARD.absorbRemaining).toBe(0)
    expect(StatusEffects.ANCESTRAL_GUARD.maxAbsorb).toBe(0)
  })

  it('ignora muertos, limita la curación a la vida máxima y registra lo recuperado', async () => {
    const caster = new MountainEnemy('shaman')
    const dead = new MountainEnemy('guardian')
    dead.health = 0
    dead.isAlive = false
    caster.health = caster.maxHealth - 2
    const log = await cast(MountainMend, caster, [dead, caster])
    expect(caster.health).toBe(caster.maxHealth)
    expect(dead.health).toBe(0)
    expect(log).toHaveBeenCalledWith(`${caster.name} recupera 2 HP.`)
    await cast(AncestralGuard, caster, [dead])
    expect(dead.statusEffects).toHaveLength(0)
  })

  it('respeta Herida abierta y no multiplica apoyos con buffs de daño', async () => {
    const caster = new MountainEnemy('shaman')
    const ally = new MountainEnemy('guardian')
    caster.baseStats.mind.value = 40
    caster.addStatusEffect({ ...StatusEffects.ATTACK_ORDER })
    ally.health = 10
    ally.addStatusEffect({ ...StatusEffects.OPEN_WOUND })
    await cast(MountainMend, caster, [ally])
    expect(ally.health).toBe(26)
    await cast(AncestralGuard, caster, [ally])
    expect(ally.statusEffects.find(effect => effect.type === 'ancestral_guard')!.maxAbsorb).toBe(32)
  })
})
