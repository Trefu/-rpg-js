import { describe, it, expect } from 'vitest'
import { Enemy } from '@/core/enemies/Enemy'
import { Dummy } from '@/core/enemies/Dummy'
import { Goblin } from '@/core/enemies/Goblin'
import { Dragon } from '@/core/enemies/Dragon'
import { SLASH, POISON_ARROW, FIRE_BREATH } from '@/core/abilities/EnemyAttacks'
import { computeAgilityCritBonus } from '@/core/crit'

/**
 * Subclase concreta minima para testear el Enemy abstracto. Usa SLASH
 * como patron por defecto (lo mas simple posible).
 */
class TestEnemy extends Enemy {
  public readonly sprite = ''
  constructor(level: number = 1) {
    super({
      id: `test-${level}`,
      name: 'TestEnemy',
      level,
      maxHealth: 100,
      experienceReward: 10,
      goldReward: { min: 1, max: 5 }
    })
  }
}

describe('Enemy abstracto: scaling de stats', () => {
  it('a nivel 1 los stats son los default (sin growth)', () => {
    const e = new TestEnemy(1)
    // ENEMY_BODY_BASELINE = 22; mind/con/agility = 10
    expect(e.baseStats.body.value).toBe(22)
    expect(e.baseStats.mind.value).toBe(10)
    expect(e.baseStats.agility.value).toBe(10)
    expect(e.baseStats.constitution.value).toBe(10)
  })

  it('a nivel N los stats escalan segun growthPerLevel (0.5 * (N-1))', () => {
    const e = new TestEnemy(5)
    // body: 22 + 4 * 0.5 = 24
    expect(e.baseStats.body.value).toBe(24)
    // mind: 10 + 4 * 0.5 = 12
    expect(e.baseStats.mind.value).toBe(12)
  })
})

describe('Enemy.attack() formula', () => {
  it('attack() = (body - 10) * 0.5 + level + variance', () => {
    const e = new TestEnemy(5) // body=24
    // raw = (24-10)*0.5 + 5 = 7 + 5 = 12
    // variance: [0.9, 1.1] → [10.8, 13.2] → floor [10, 13]
    // Muestreo
    let allInRange = true
    for (let i = 0; i < 100; i++) {
      const a = e.attack()
      if (a < 10 || a > 13) {
        allInRange = false
        break
      }
    }
    expect(allInRange).toBe(true)
  })

  it('attack() = 0 si isAlive es false', () => {
    const e = new TestEnemy(1)
    e.isAlive = false
    expect(e.attack()).toBe(0)
  })

  it('attack() crece con cada nivel (body y level suben)', () => {
    const e1 = new TestEnemy(1)
    const e5 = new TestEnemy(5)
    // Muestreo de promedios
    let sum1 = 0, sum5 = 0
    for (let i = 0; i < 100; i++) {
      sum1 += e1.attack()
      sum5 += e5.attack()
    }
    expect(sum5 / 100).toBeGreaterThan(sum1 / 100)
  })
})

describe('Enemy.defense() formula', () => {
  it('defense() depende de body y constitution (computeDefense)', () => {
    const e = new TestEnemy(1) // body=22, con=10
    // No podemos predecir el valor exacto (computeDefense es interno) pero
    // sabemos que crece con body y con.
    const d1 = e.defense()
    e.baseStats.constitution.value += 5
    expect(e.defense()).toBeGreaterThan(d1)
  })
})

describe('Enemy.calculatePhaseDamage()', () => {
  it('usa mind para daño magico, body para fisico', () => {
    const e = new TestEnemy(5) // mind=12, body=24
    // patron physical: usa body → (24-10)*0.5 = 7 + level * 1 = 12
    // patron fire: usa mind → (12-10)*coeff + level * 1
    // No podemos verificar el valor exacto sin saber el coeficiente, pero
    // podemos verificar que al subir body sube el daño fisico.
    const baseline = e.calculatePhaseDamage({
      name: 'test',
      type: 'physical',
      damageType: 'physical',
      baseMaxBlockReduction: 0,
      damageMultiplier: 1,
      phases: [{ cells: [] }]
    } as never)
    e.baseStats.body.value += 10
    const boosted = e.calculatePhaseDamage({
      name: 'test',
      type: 'physical',
      damageType: 'physical',
      baseMaxBlockReduction: 0,
      damageMultiplier: 1,
      phases: [{ cells: [] }]
    } as never)
    expect(boosted).toBeGreaterThan(baseline)
  })

  it('el damageMultiplier del patron multiplica el resultado', () => {
    const e = new TestEnemy(1)
    const base = e.calculatePhaseDamage({
      name: 'test',
      type: 'physical',
      damageType: 'physical',
      baseMaxBlockReduction: 0,
      damageMultiplier: 1,
      phases: [{ cells: [] }]
    } as never)
    const doubled = e.calculatePhaseDamage({
      name: 'test',
      type: 'physical',
      damageType: 'physical',
      baseMaxBlockReduction: 0,
      damageMultiplier: 2,
      phases: [{ cells: [] }]
    } as never)
    // doubled deberia ser ~2x base (con varianza puede ser ±1)
    expect(doubled).toBeGreaterThan(base)
  })
})

describe('Enemy crit', () => {
  it('getEffectiveCritChance = critChance + agilityBonus', () => {
    const e = new TestEnemy(1) // critChance default 5, agility=10 → bonus 0
    expect(e.getEffectiveCritChance()).toBe(5)

    e.baseStats.agility.value = 20 // +log(11)*2 ≈ 4.8
    const expected = 5 + computeAgilityCritBonus(20)
    expect(e.getEffectiveCritChance()).toBeCloseTo(expected, 3)
  })

  it('rollCrit devuelve crit segun la chance efectiva', () => {
    const e = new TestEnemy(1)
    e.critChance = 100 // siempre crit
    // 1000 trials: todos crits (no overcrit porque rng < 1.0 → roll < 100)
    let crits = 0
    for (let i = 0; i < 200; i++) {
      if (e.rollCrit().isCrit) crits++
    }
    expect(crits).toBe(200)
  })
})

describe('Enemy.getRewards', () => {
  it('goldReward se calcula entre min y max inclusivos', () => {
    const e = new TestEnemy(1) // min:1, max:5
    for (let i = 0; i < 100; i++) {
      const { gold } = e.getRewards()
      expect(gold).toBeGreaterThanOrEqual(1)
      expect(gold).toBeLessThanOrEqual(5)
    }
  })

  it('experienceReward es un numero fijo', () => {
    const e = new TestEnemy(1)
    expect(e.getRewards().experience).toBe(10)
  })
})

describe('Enemy.removeExpiredStatusEffects + reduceStatusEffects', () => {
  it('reduceStatusEffects decrementa turns y remueve los que llegan a 0', () => {
    const e = new TestEnemy(1)
    e.addStatusEffect({
      type: 'stun',
      name: 'Stun',
      description: 'test',
      isBuff: false,
      turns: 2,
      icon: ''
    })
    e.reduceStatusEffects()
    expect(e.hasStatusEffect('stun')).toBe(true)
    e.reduceStatusEffects()
    expect(e.hasStatusEffect('stun')).toBe(false)
  })

  it('reduceStatusEffects NO decrementa efectos con cleanAtTurnStart: false', () => {
    const e = new TestEnemy(1)
    e.addStatusEffect({
      type: 'rooted',
      name: 'Rooted',
      description: 'test',
      isBuff: false,
      turns: 2,
      icon: '',
      cleanAtTurnStart: false
    })
    e.reduceStatusEffects()
    e.reduceStatusEffects()
    expect(e.hasStatusEffect('rooted')).toBe(true)
    e.removeStatusEffect('rooted')
    expect(e.hasStatusEffect('rooted')).toBe(false)
  })
})

describe('Enemy.selectAttackPattern', () => {
  it('elige un patron al azar de la lista', () => {
    class MultiEnemy extends Enemy {
      public readonly sprite = ''
      constructor() {
        super({
          id: 'multi', name: 'M', level: 1,
          maxHealth: 100, experienceReward: 0, goldReward: { min: 0, max: 0 }
        })
      }
    }
    const e = new MultiEnemy()
    e.attackPatterns = [SLASH, POISON_ARROW, FIRE_BREATH]
    const seen = new Set<string>()
    for (let i = 0; i < 100; i++) {
      const p = e.selectAttackPattern(null)
      seen.add(p.name ?? '')
    }
    expect(seen.size).toBeGreaterThan(1) // al menos 2 distintos en 100 trials
  })

  it('tira error si no tiene attackPatterns', () => {
    const e = new TestEnemy(1)
    expect(() => e.selectAttackPattern(null)).toThrow()
  })
})

describe('Subclases concretas', () => {
  it('enemigos concretos tienen al menos un patron de ataque', () => {
    // Smoke check: evita que un enemy nuevo salga sin `attackPatterns`.
    // No asserta nombres especificos (eso era limitante ante renames).
    expect(new Goblin(1).attackPatterns.length).toBeGreaterThan(0)
    expect(new Dragon(8).attackPatterns.length).toBeGreaterThan(0)
  })

  it('Dragon tiene 4 acciones (3 patrones + DragonRoar)', () => {
    const d = new Dragon(8)
    expect(d.attackPatterns.length).toBe(4)
    const hasPattern = d.attackPatterns.some(p => 'phases' in p)
    const hasMitigatedSplash = d.attackPatterns.some(p => 'mitigatedSplash' in p)
    expect(hasPattern).toBe(true) // los visuales
    expect(hasMitigatedSplash).toBe(true) // DragonRoar (patron con splash)
  })

  it('DragonRoar declara mitigatedSplash con damageMultiplier 0.2', () => {
    // Regression: el splash post-defense se calcula sobre el daño
    // mitigado del primario; este multiplicador es la unica fuente
    // de ese 20%. Cambiarlo sin actualizar tests rompe el balance.
    const d = new Dragon(8)
    const roar = d.attackPatterns.find(p => 'mitigatedSplash' in p)
    expect(roar).toBeDefined()
    expect((roar as { mitigatedSplash?: { damageMultiplier: number } }).mitigatedSplash?.damageMultiplier).toBe(0.2)
  })
})

describe('Dummy', () => {
  it('Dummy nunca muere (takeDamage clamp HP a 1)', () => {
    const d = new Dummy(1)
    d.takeDamage(99999)
    expect(d.health).toBe(1)
    expect(d.isAlive).toBe(true)
  })

  it('Dummy tiene critChance=0 por default', () => {
    const d = new Dummy(1)
    expect(d.critChance).toBe(0)
    expect(d.getEffectiveCritChance()).toBe(0)
  })

  it('Dummy.selectAttackPattern devuelve el forcedPattern si esta seteado', () => {
    const d = new Dummy(1)
    d.setForcedPattern(SLASH)
    expect(d.selectAttackPattern(null)).toBe(SLASH)
  })

  it('Dummy.reset() limpia estado (status, hp full, patterns)', () => {
    const d = new Dummy(1)
    d.health = 1
    d.addStatusEffect({ type: 'stun', name: 'Stun', description: 'test', isBuff: false, turns: 5, icon: '' })
    d.setCritChanceOverride(50)
    d.reset()
    expect(d.health).toBe(d.maxHealth)
    expect(d.statusEffects.length).toBe(0)
    expect(d.critChanceOverride).toBeNull()
  })
})
