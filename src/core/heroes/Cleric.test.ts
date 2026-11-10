import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Cleric } from './Cleric'
import { Warrior } from './Warrior'
import { MountainEnemy } from '../enemies/mountainPeak/MountainEnemy'
import { ClericDivineBlessing, getDivineBlessingAmount } from '../abilities/Abilities'
import { getAbility } from '../abilities/registry'
import { StatusEffects } from '../StatusEffects'
import { getShieldAmount, healthWithShield } from '../combat/shields'
import { getOutgoingDamageMultiplier } from '../combat/damageModifiers'
import type { AbilityContext } from '../interfaces/IAbility'
import type { ICharacter } from '../interfaces/ICharacter'
import type { AudioManager } from '../AudioManager'

function context(caster = Cleric.createStarter(), target: ICharacter | null = new Warrior()): AbilityContext {
  return {
    caster, target, ability: ClericDivineBlessing, allies: [caster, ...(target ? [target] : [])],
    animationDelay: 0, energySpent: 40, log: vi.fn(), showEnemyHit: vi.fn(),
    playEnemyVfx: vi.fn(), playHeroVfx: vi.fn(), showPlayerHit: vi.fn(), showAnnouncement: vi.fn(),
    audioManager: {} as AudioManager
  }
}
async function cast(ctx: AbilityContext) {
  const promise = ClericDivineBlessing.execute(ctx)
  await vi.runAllTimersAsync()
  await promise
}

describe('Bendición Divina de Elara', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

  it('reserva la fórmula para el chip y mantiene la descripción breve', () => {
    expect(ClericDivineBlessing.description).not.toMatch(/⌊|×|sin superar|vida máxima/)
    expect(ClericDivineBlessing.description).toContain('+20% de daño durante 3 turnos')
    expect(ClericDivineBlessing.previewEffect!(Cleric.createStarter()).formula).toContain('× 2')
  })

  it('reemplaza Castigo Divino por un buff dirigido a aliados, manteniendo el coste de energía', () => {
    const cleric = Cleric.createStarter()
    expect(cleric.abilities).toContain(ClericDivineBlessing)
    expect(cleric.abilities.some(ability => ability.type === 'clericDivineSmite')).toBe(false)
    expect(getAbility('clericDivineBlessing')).toBe(ClericDivineBlessing)
    expect(ClericDivineBlessing.targetType).toBe('allies-only')
    expect(ClericDivineBlessing.requiresTarget).toBe(true)
    expect(ClericDivineBlessing.energyCost).toBe(40)
    expect(ClericDivineBlessing.pipeline).toBeUndefined()
    expect(ClericDivineBlessing.previewDamage).toBeUndefined()
  })

  it.each([1, 4, 9])('el escudo y su fórmula escalan con Mente y nivel (%i)', async level => {
    const cleric = new Cleric(level)
    cleric.baseStats.mind.value = 23.5
    const ctx = context(cleric)
    const n = Math.floor(2 * 23.5 + 8 * level)
    await cast(ctx)
    expect(getShieldAmount(ctx.target)).toBe(n)
    expect(getDivineBlessingAmount(cleric)).toBe(n)
    const preview = ClericDivineBlessing.previewEffect!(cleric)
    expect(preview.value).toBe(`${n} HP · +20% daño`)
    expect(preview.formula).toContain(`${n} HP de escudo`)
    expect(preview.label).toBe('Vida temporal')
  })

  it('protege al aliado sin curarlo ni aumentar su vida máxima; cura a Elara exactamente n', async () => {
    const ctx = context()
    const n = getDivineBlessingAmount(ctx.caster as Cleric)
    ctx.caster.health = 1
    ctx.target!.health = 15
    const maxHealth = ctx.target!.maxHealth
    await cast(ctx)
    expect(ctx.target!.health).toBe(15)
    expect(ctx.target!.maxHealth).toBe(maxHealth)
    expect(getShieldAmount(ctx.target)).toBe(n)
    expect(ctx.caster.health).toBe(1 + n)
    expect(ctx.showPlayerHit).toHaveBeenCalledWith(n, { heroId: ctx.caster.id, variant: 'heal' })
    expect(getOutgoingDamageMultiplier(ctx.target!.statusEffects)).toBeCloseTo(1.2)
    expect(getOutgoingDamageMultiplier(ctx.caster.statusEffects)).toBe(1)
  })

  it('al lanzarse sobre sí misma recibe escudo y daño extra, pero no curación', async () => {
    const cleric = new Cleric()
    cleric.health = 1
    const ctx = context(cleric, cleric)
    await cast(ctx)
    expect(cleric.health).toBe(1)
    expect(getShieldAmount(cleric)).toBe(getDivineBlessingAmount(cleric))
    expect(getOutgoingDamageMultiplier(cleric.statusEffects)).toBeCloseTo(1.2)
    expect(ctx.showPlayerHit).not.toHaveBeenCalled()
  })

  it('la curación respeta el máximo y los modificadores de curación', async () => {
    const ctx = context()
    ctx.caster.health = ctx.caster.maxHealth - 5
    await cast(ctx)
    expect(ctx.caster.health).toBe(ctx.caster.maxHealth)
    ctx.caster.health = 1
    ctx.caster.addStatusEffect({ ...StatusEffects.OPEN_WOUND })
    ctx.target!.removeStatusEffect('divine_protection')
    await cast(ctx)
    expect(ctx.caster.health).toBe(1 + Math.floor(getDivineBlessingAmount(ctx.caster as Cleric) * 0.65))
  })

  it('el escudo absorbe primero; solo el excedente daña y no elimina el buff de daño', async () => {
    const ctx = context()
    await cast(ctx)
    const target = ctx.target!
    const n = getShieldAmount(target)
    const hp = target.health
    target.takeDamage(10)
    expect(target.health).toBe(hp)
    expect(getShieldAmount(target)).toBe(n - 10)
    expect(healthWithShield(target)).toContain(`+${n - 10} escudo`)
    target.takeDamage(n)
    expect(target.health).toBe(hp - 10)
    expect(getShieldAmount(target)).toBe(0)
    expect(target.hasStatusEffect('divine_protection')).toBe(false)
    expect(target.hasStatusEffect('divine_empowerment')).toBe(true)
    expect(getOutgoingDamageMultiplier(target.statusEffects)).toBeCloseTo(1.2)
  })

  it('rechaza al aliado mientras conserve escudo divino sin refrescarlo ni curar a Elara', async () => {
    const ctx = context()
    await cast(ctx)
    const target = ctx.target as Warrior
    target.takeDamage(10)
    target.reduceStatusEffects()
    ctx.caster.health = 1
    expect(ClericDivineBlessing.isValidTarget!(target)).toBe(false)
    await cast(ctx)
    expect(getShieldAmount(target)).toBe(getDivineBlessingAmount(ctx.caster as Cleric) - 10)
    expect(target.statusEffects.find(effect => effect.type === 'divine_protection')?.turns).toBe(2)
    expect(ctx.caster.health).toBe(1)
  })

  it('permite bendecir de nuevo al agotarse el escudo aunque siga el +20%', async () => {
    const ctx = context()
    await cast(ctx)
    const target = ctx.target as Warrior
    target.takeDamage(getShieldAmount(target))
    target.reduceStatusEffects()
    expect(ClericDivineBlessing.isValidTarget!(target)).toBe(true)
    await cast(ctx)
    expect(getShieldAmount(target)).toBe(getDivineBlessingAmount(ctx.caster as Cleric))
    expect(target.statusEffects.filter(effect => effect.type === 'divine_protection')).toHaveLength(1)
    expect(target.statusEffects.find(effect => effect.type === 'divine_empowerment')?.turns).toBe(3)
    expect(getOutgoingDamageMultiplier(target.statusEffects)).toBeCloseTo(1.2)
    for (let turn = 0; turn < 3; turn++) target.reduceStatusEffects()
    expect(getShieldAmount(target)).toBe(0)
    expect(getOutgoingDamageMultiplier(target.statusEffects)).toBe(1)
  })

  it('permite seleccionar al aliado cuando caduca el escudo', async () => {
    const ctx = context()
    await cast(ctx)
    const target = ctx.target as Warrior
    for (let turn = 0; turn < 3; turn++) target.reduceStatusEffects()
    expect(ClericDivineBlessing.isValidTarget!(target)).toBe(true)
    await cast(ctx)
    expect(getShieldAmount(target)).toBe(getDivineBlessingAmount(ctx.caster as Cleric))
  })

  it('coexiste con Escudo Arcano sin mostrar escudo que no pueda absorber daño', async () => {
    const ctx = context()
    ctx.target!.addStatusEffect({ ...StatusEffects.ARCANE_SHIELD })
    await cast(ctx)
    const n = getDivineBlessingAmount(ctx.caster as Cleric)
    expect(getShieldAmount(ctx.target)).toBe(n + 30)
    const before = ctx.target!.health
    ctx.target!.takeDamage(n + 35)
    expect(ctx.target!.health).toBe(before - 5)
    expect(getShieldAmount(ctx.target)).toBe(0)
  })

  it('no actúa sobre muertos, enemigos ni objetivos ausentes', async () => {
    const caster = new Cleric()
    const enemy = new MountainEnemy('scout')
    const enemyCtx = { ...context(caster, enemy), allies: [caster] }
    await cast(enemyCtx)
    expect(enemy.statusEffects).toHaveLength(0)
    const dead = new Warrior()
    dead.isAlive = false
    await cast(context(caster, dead))
    expect(dead.statusEffects).toHaveLength(0)
    await cast(context(caster, null))
    caster.isAlive = false
    const ctx = context(caster)
    await cast(ctx)
    expect(ctx.target!.statusEffects).toHaveLength(0)
  })
})
