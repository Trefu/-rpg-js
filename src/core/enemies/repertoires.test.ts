import { describe, expect, it } from 'vitest'
import type { EnemyAction, IEnemy } from '../interfaces/ICharacter'
import { Goblin } from './Goblin'
import { GoblinArcher } from './GoblinArcher'
import { GoblinWarlock } from './GoblinWarlock'
import { Bandit } from './Bandit'
import { BanditArcher } from './BanditArcher'
import { BanditRogue } from './BanditRogue'
import { BanditCaptain } from './BanditCaptain'
import { Wolf } from './Wolf'
import { Orc } from './Orc'
import { OrcArcher } from './OrcArcher'
import { Dragon } from './Dragon'
import { MountainEnemy, MOUNTAIN_ROLES } from './MountainEnemy'
import { ENTANGLE } from '../abilities/EnemyAttacks'
import { getAbility, getEnemyAttack } from '../abilities/registry'

/** Support actions (ally buffs/heals) never count towards the offensive minimum. */
function offensiveNames(actions: EnemyAction[]): string[] {
  return actions
    .filter(action => !('targetType' in action) || action.targetType !== 'allies-only')
    .map(action => action.name ?? '')
}

const CONCRETE_ENEMIES: Array<() => IEnemy> = [
  () => new Goblin(1),
  () => new GoblinArcher(1),
  () => new GoblinWarlock(1),
  () => new Bandit(1),
  () => new BanditArcher(1),
  () => new BanditRogue(1),
  () => new BanditCaptain(1),
  () => new Wolf(1),
  () => new Orc(1),
  () => new OrcArcher(1),
  () => new Dragon(8)
]

describe('Variedad mínima de repertorios enemigos', () => {
  it.each(CONCRETE_ENEMIES.map(factory => [factory().name, factory]))('%s tiene al menos 4 ataques ofensivos distintos', (_name, factory) => {
    const enemy = factory()
    const offensive = offensiveNames(enemy.attackPatterns)
    expect(new Set(offensive).size).toBeGreaterThanOrEqual(4)
    expect(offensive).toHaveLength(new Set(offensive).size)
  })

  it.each(MOUNTAIN_ROLES.map(role => [role]))('MountainEnemy %s tiene al menos 4 ataques ofensivos distintos', role => {
    const enemy = new MountainEnemy(role, 1)
    const offensive = offensiveNames(enemy.attackPatterns)
    expect(new Set(offensive).size).toBeGreaterThanOrEqual(4)
    expect(offensive).toHaveLength(new Set(offensive).size)
  })

  it.each(MOUNTAIN_ROLES)('%s puede seleccionar todos sus ataques y tiene sus acciones registradas', role => {
    const enemy = new MountainEnemy(role, 2)
    const expected = new Set(offensiveNames(enemy.attackPatterns))
    const selected: EnemyAction[] = []
    for (let turn = 0; turn < enemy.attackPatterns.length; turn++) selected.push(enemy.selectAttackPattern(null))
    expect(new Set(offensiveNames(selected))).toEqual(expected)
    expect(enemy.sprite).toBeTruthy()
    for (const action of selected) {
      if ('execute' in action) expect(getAbility(action.type)).toBe(action)
      else {
        expect(getEnemyAttack(action.name!)).toBe(action)
        expect(action.phases?.length).toBeGreaterThan(0)
      }
    }
  })

  it('regresión: el goblin arquero conserva Enredar en su repertorio', () => {
    const names = new GoblinArcher(1).attackPatterns.map(pattern => pattern.name)
    expect(names).toContain(ENTANGLE.name)
  })

  it('el antiguo guardia es el Rey Goblin, con estadísticas de líder y cuatro ataques propios', () => {
    const king = new MountainEnemy('goblinGuard')
    expect(king.name).toBe('Rey Goblin')
    expect(king.enemyGroup).toBe('goblins')
    expect(king.combatRole).toBe('tank')
    expect(king.maxHealth).toBe(405)
    expect(king.baseStats.body.value).toBe(32)
    expect(king.baseStats.mind.value).toBe(20)
    expect(king.baseStats.agility.value).toBe(11)
    expect(new MountainEnemy('goblinGuard', 2).maxHealth).toBe(489)
    expect(king.selectAttackPattern(null).name).toBe('Orden de ataque')
    expect(offensiveNames(king.attackPatterns)).toEqual([
      'Tajo del Rey Goblin', 'Golpe de cetro', 'Barrido real', 'Furia del Rey Goblin'
    ])
    expect(king.attackPatterns.some(action => action.name === 'Guardia ancestral')).toBe(true)
  })
})
