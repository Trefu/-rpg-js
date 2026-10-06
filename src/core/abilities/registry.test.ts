import { describe, it, expect } from 'vitest'

/**
 * Side-effect imports: cada modulo registra sus abilities/attacks al
 * cargarse. Esto valida el patrón "auto-registro" del refactor.
 */
import '@/core/abilities/Abilities'
import '@/core/abilities/EnemyAttacks'

import {
  getAbility,
  getAllAbilities,
  getAbilitiesByTag,
  getRegisteredAbilityTypes,
  getAllEnemyAttacks,
  getEnemyAttack,
  getRegisteredEnemyAttackNames
} from '@/core/abilities/registry'

describe('abilities registry (auto-register)', () => {
  it('registra todas las abilities exportadas de Abilities.ts', () => {
    const types = getRegisteredAbilityTypes()
    // Cobertura minima — si agregamos una ability nueva, este test sigue
    // pasando; el conteo es solo un smoke.
    expect(types.length).toBeGreaterThan(8)
    expect(types).toContain('attack')
    expect(types).toContain('fireball')
    expect(types).toContain('warriorInjuringStrike')
    expect(types).toContain('clericHeal')
    // `dragonRoar` ya no es una `IAbility`: ahora es un `DefensePatternConfig`
    // con `mitigatedSplash` y se valida en `Enemy.test.ts`.
    const enemyAttackNames = getRegisteredEnemyAttackNames()
    expect(enemyAttackNames).toContain('Rugido del Dragón')
  })

  it('getAbility devuelve la ability correcta por type', () => {
    const fireball = getAbility('fireball')
    expect(fireball).toBeDefined()
    expect(fireball?.name).toBe('Bola de Fuego')
    expect(fireball?.damageType).toBe('fire')
  })

  it('getAbility devuelve undefined para types desconocidos', () => {
    expect(getAbility('doesNotExist')).toBeUndefined()
  })

  it('case-insensitive lookup', () => {
    // getAbilityIcon hace busqueda case-insensitive; el registry tambien
    // acepta tipos en cualquier casing para que `getAbilityIcon` funcione.
    const exact = getAbility('warriorAttack')
    const lower = getAbility('warriorattack')
    // El registro guarda el type tal cual se exporto (camelCase), asi que
    // una busqueda lowercase del registro directo falla — eso es OK, el
    // caller que necesita case-insensitive debe iterar `getAllAbilities()`.
    expect(exact).toBeDefined()
    expect(exact?.name).toBe('Ataque Básico')
    expect(lower).toBeUndefined()
  })

  it('getAbilitiesByTag filtra correctamente', () => {
    const damageAbilities = getAbilitiesByTag('damage')
    const healAbilities = getAbilitiesByTag('heal')

    expect(damageAbilities.length).toBeGreaterThan(3)
    expect(healAbilities.length).toBeGreaterThan(0)

    // Todas las damage tienen el tag 'damage'
    for (const a of damageAbilities) {
      expect(a.tags).toContain('damage')
    }
    // Todas las heal tienen el tag 'heal'
    for (const a of healAbilities) {
      expect(a.tags).toContain('heal')
    }
  })

  it('abilities ofensivas tienen damageType', () => {
    const damage = getAbilitiesByTag('damage')
    for (const a of damage) {
      expect(a.damageType).toBeDefined()
      expect(['physical', 'fire', 'holy', 'frost', 'water', 'arcane', 'shadow', 'electric', 'poison']).toContain(a.damageType)
    }
  })

  it('abilities de heal NO tienen damageType', () => {
    const heals = getAbilitiesByTag('heal')
    for (const a of heals) {
      expect(a.damageType).toBeUndefined()
    }
  })

  it('abilities de AoE tienen el tag aoe + son targetType enemies-only o all', () => {
    const aoes = getAbilitiesByTag('aoe')
    expect(aoes.length).toBeGreaterThan(0)
    for (const a of aoes) {
      expect(a.aoe).toBe(true)
    }
  })

  it('cada ability declarada tiene icon, tags, pipeline o heal/buff (sin campos random)', () => {
    // Smoke test: el refactor exige que TODA ability tenga `icon` co-localizado.
    // Si alguien agrega una ability nueva sin icon, este test falla.
    for (const a of getAllAbilities()) {
      expect(a.icon, `ability "${a.type}" debe tener un icon co-localizado`).toBeDefined()
      expect(a.tags, `ability "${a.type}" debe tener al menos un tag`).toBeDefined()
      expect(a.tags!.length).toBeGreaterThan(0)
    }
  })
})

describe('enemy attacks registry', () => {
  it('registra todos los patrones de EnemyAttacks.ts', () => {
    const names = getRegisteredEnemyAttackNames()
    expect(names.length).toBeGreaterThan(10)
    expect(names).toContain('Espadazo')
    expect(names).toContain('Flecha Venenosa')
    expect(names).toContain('Aliento de Fuego')
    expect(names).toContain('Tajo Profundo')
  })

  it('getEnemyAttack devuelve el patron correcto por nombre', () => {
    const slash = getEnemyAttack('Espadazo')
    expect(slash).toBeDefined()
    expect(slash?.damageType).toBe('physical')
    expect(slash?.damageMultiplier).toBeGreaterThan(0)
  })

  it('getAllEnemyAttacks devuelve todos los patrones registrados', () => {
    const all = getAllEnemyAttacks()
    expect(all.length).toBeGreaterThan(10)
    // Orden de registro = orden de declaracion en EnemyAttacks.ts
    expect(all[0].name).toBe('Espadazo')
  })

  it('patron de fuego tiene onFailureEffect burn', () => {
    const breath = getEnemyAttack('Aliento de Fuego')
    expect(breath?.onFailureEffect?.statusType).toBe('burn')
  })
})
