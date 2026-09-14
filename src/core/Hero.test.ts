import { describe, it, expect } from 'vitest'
import { Warrior } from '@/core/heroes/Warrior'
import { Cleric } from '@/core/heroes/Cleric'
import { Fireball } from '@/core/abilities/Abilities'

describe('Hero base class', () => {
  it('un Hero nuevo arranca con vida y energia al maximo', () => {
    const w = new Warrior(1)
    expect(w.health).toBe(w.maxHealth)
    expect(w.energy).toBe(w.maxEnergy)
    expect(w.isAlive).toBe(true)
  })

  it('levelUp incrementa level y suma stats segun growth', () => {
    const w = new Warrior(1)
    const startBody = w.baseStats.body.value
    const startMind = w.baseStats.mind.value
    const startAgility = w.baseStats.agility.value
    const startCon = w.baseStats.constitution.value

    w.levelUp()

    expect(w.level).toBe(2)
    // Warrior growth: body=7, mind=1, agility=2, constitution=5
    // STAT_BASE_GROWTH = 1 → cada stat += 1 + growthPerLevel
    expect(w.baseStats.body.value).toBe(startBody + 1 + 7)
    expect(w.baseStats.mind.value).toBe(startMind + 1 + 1)
    expect(w.baseStats.agility.value).toBe(startAgility + 1 + 2)
    expect(w.baseStats.constitution.value).toBe(startCon + 1 + 5)
  })

  it('levelUp restaura HP al maximo y suma 10 de max energy', () => {
    const w = new Warrior(1)
    w.health = 1
    const maxEnergyBefore = w.maxEnergy
    w.levelUp()
    expect(w.health).toBe(w.maxHealth)
    expect(w.maxEnergy).toBe(maxEnergyBefore + 10)
    expect(w.energy).toBe(w.maxEnergy)
  })

  it('levelUp aumenta experienceToNextLevel x1.5 (floor)', () => {
    const w = new Warrior(1)
    const etnlBefore = w.experienceToNextLevel
    w.levelUp()
    expect(w.experienceToNextLevel).toBe(Math.floor(etnlBefore * 1.5))
  })

  it('gainExperience dispara levelUp自动 si supera el threshold', () => {
    const w = new Warrior(1)
    const etnl = w.experienceToNextLevel
    w.gainExperience(etnl + 1)
    expect(w.level).toBe(2)
    expect(w.experience).toBe(1)
  })

  it('spendEnergy devuelve false si no alcanza', () => {
    const w = new Warrior(1)
    const result = w.spendEnergy(w.energy + 1)
    expect(result).toBe(false)
    expect(w.energy).toBe(w.maxEnergy) // no se desconto
  })

  it('spendEnergy devuelve true y descuenta si alcanza', () => {
    const w = new Warrior(1)
    const ok = w.spendEnergy(10)
    expect(ok).toBe(true)
    expect(w.energy).toBe(w.maxEnergy - 10)
  })

  it('restoreEnergy cappea en maxEnergy', () => {
    const w = new Warrior(1)
    w.energy = w.maxEnergy - 5
    const restored = w.restoreEnergy(100)
    expect(restored).toBe(5)
    expect(w.energy).toBe(w.maxEnergy)
  })

  it('learnAbility agrega una ability nueva', () => {
    const w = new Warrior(1)
    const beforeCount = w.abilities.length
    w.learnAbility(Fireball)
    expect(w.abilities.length).toBe(beforeCount + 1)
    expect(w.abilities.some(a => a.type === 'fireball')).toBe(true)
  })

  it('learnAbility rechaza abilities con type duplicado (no duplica)', () => {
    const w = new Warrior(1)
    const beforeCount = w.abilities.length
    w.learnAbility(Fireball)
    w.learnAbility(Fireball) // duplicado
    expect(w.abilities.filter(a => a.type === 'fireball').length).toBe(1)
    expect(w.abilities.length).toBe(beforeCount + 1)
  })

  it('learnAbility permite cualquier cantidad de abilities (sin cap explicito)', () => {
    const w = new Warrior(1)
    while (w.abilities.length > 0) w.abilities.pop()
    for (let i = 0; i < 6; i++) {
      w.learnAbility({
        name: `Test${i}`, description: 't', type: `test${i}`, cooldown: 0, targetType: 'enemies-only'
      } as never)
    }
    expect(w.abilities.length).toBe(6)
  })

  it('takeDamage reduce HP y clamp a 0', () => {
    const w = new Warrior(1)
    const dmg = w.health - 5
    w.takeDamage(dmg)
    expect(w.health).toBe(5)
    w.takeDamage(9999)
    expect(w.health).toBe(0)
    expect(w.isAlive).toBe(false)
  })

  it('heal sube HP y cappea en maxHealth', () => {
    const w = new Warrior(1)
    w.health = 10
    w.heal(5)
    expect(w.health).toBe(15)
    w.heal(9999)
    expect(w.health).toBe(w.maxHealth)
  })
})

describe('Warrior class', () => {
  it('comienza con sus stats base (body alto, mind bajo)', () => {
    const w = new Warrior(1)
    expect(w.name).toBe('Bjorn')
    expect(w.heroClassId).toBe('warrior')
    expect(w.baseStats.body.value).toBeGreaterThan(w.baseStats.mind.value)
    expect(w.baseStats.body.growthPerLevel).toBe(7)
  })

  it('createStarter aprende las 5 abilities warrior (basic + 3 + definitiva)', () => {
    const w = Warrior.createStarter()
    expect(w.abilities.length).toBe(5)
    const types = w.abilities.map(a => a.type)
    expect(types).toContain('warriorAttack') // basic attack
    expect(types).toContain('warriorInjuringStrike')
    expect(types).toContain('warriorDevastatingStrike')
    expect(types).toContain('secondWind')
  })

  it('el basicAttack del constructor se guarda como primera ability (warriorAttack)', () => {
    const w = new Warrior(1)
    // `basicAttack` no es un campo propio del Hero — el constructor lo
    // mete en `abilities[0]` via learnAbility. Buscamos por type.
    const basic = w.abilities.find(a => a.type === 'warriorAttack')
    expect(basic).toBeDefined()
    expect(basic!.damageType).toBe('physical')
    expect(basic!.name).toBe('Ataque Básico')
  })
})

describe('Cleric class', () => {
  it('comienza con mind alto, body bajo', () => {
    const c = new Cleric(1)
    expect(c.name).toBe('Elara')
    expect(c.heroClassId).toBe('cleric')
    expect(c.baseStats.mind.value).toBeGreaterThan(c.baseStats.body.value)
    expect(c.baseStats.mind.growthPerLevel).toBe(7)
  })

  it('createStarter aprende las 5 abilities cleric (basic + 3 + definitiva)', () => {
    const c = Cleric.createStarter()
    expect(c.abilities.length).toBe(5)
    const types = c.abilities.map(a => a.type)
    expect(types).toContain('clericAttack') // basic attack
    expect(types).toContain('clericRadiantStrike')
    expect(types).toContain('clericDivineSmite')
    expect(types).toContain('clericHeal')
  })

  it('el basicAttack del constructor se guarda como primera ability (clericAttack)', () => {
    const c = new Cleric(1)
    const basic = c.abilities.find(a => a.type === 'clericAttack')
    expect(basic).toBeDefined()
    expect(basic!.damageType).toBe('holy')
  })
})

describe('Hero.attack() formula', () => {
  it('Warrior escala mas con body que Cleric (formula body * 0.5 + level)', () => {
    const w = new Warrior(5)
    const c = new Cleric(5)
    // Mismo level, body mayor en warrior → attack() mayor
    expect(w.attack()).toBeGreaterThan(c.attack())
  })

  it('attack() aumenta con cada levelUp (body + level suben)', () => {
    const w = new Warrior(1)
    const initialAttack = w.attack()
    w.levelUp()
    expect(w.attack()).toBeGreaterThan(initialAttack)
  })
})

describe('Hero.heroism', () => {
  it('un Hero nuevo arranca con Heroismo en 0 / 100', () => {
    const w = new Warrior(1)
    expect(w.heroism).toBe(0)
    expect(w.maxHeroism).toBe(100)
    expect(w.canUseUltimate()).toBe(false)
  })

  it('restoreHeroism cape a en maxHeroism y devuelve la cantidad realmente anadida', () => {
    const w = new Warrior(1)
    w.restoreHeroism(40)
    expect(w.heroism).toBe(40)
    const added = w.restoreHeroism(1000)
    expect(added).toBe(60)
    expect(w.heroism).toBe(100)
  })

  it('spendHeroism devuelve false sin gastar y true si alcanza', () => {
    const w = new Warrior(1)
    w.restoreHeroism(30)
    expect(w.spendHeroism(40)).toBe(false)
    expect(w.heroism).toBe(30)
    expect(w.spendHeroism(20)).toBe(true)
    expect(w.heroism).toBe(10)
  })

  it('canUseUltimate es true solo al llegar al maximo y estando vivo', () => {
    const w = new Warrior(1)
    w.restoreHeroism(99)
    expect(w.canUseUltimate()).toBe(false)
    w.restoreHeroism(1)
    expect(w.canUseUltimate()).toBe(true)
    // Forzar la muerte con un golpe mortal: takeDamage dispara checkHealth.
    w.takeDamage(99999)
    expect(w.isAlive).toBe(false)
    expect(w.canUseUltimate()).toBe(false)
  })

  it('takeDamage convierte parte del HP perdido en Heroismo', () => {
    const w = new Warrior(1)
    w.maxHealth = 100
    w.health = 100
    w.takeDamage(25)
    // divisor default 5 → floor(25/5) = 5
    expect(w.heroism).toBe(5)
    expect(w.health).toBe(75)
  })

  it('getTurnEndHeroismRegen devuelve el passiveHeroismRegen por defecto', () => {
    const w = new Warrior(1)
    expect(w.getTurnEndHeroismRegen()).toBe(15)
  })

  it('createStarter aprende las 4 abilities warrior incluyendo la definitiva', () => {
    const w = Warrior.createStarter()
    const types = w.abilities.map(a => a.type)
    expect(types).toContain('warriorUltimate')
    const ult = w.abilities.find(a => a.type === 'warriorUltimate')
    expect(ult?.heroismCost).toBe(100)
  })

  it('createStarter aprende las 4 abilities cleric incluyendo la definitiva', () => {
    const c = Cleric.createStarter()
    const types = c.abilities.map(a => a.type)
    expect(types).toContain('clericUltimate')
    const ult = c.abilities.find(a => a.type === 'clericUltimate')
    expect(ult?.heroismCost).toBe(100)
  })
})
