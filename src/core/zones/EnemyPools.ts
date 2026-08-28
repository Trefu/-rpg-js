import { Goblin } from '../enemies/Goblin'
import { GoblinArcher } from '../enemies/GoblinArcher'
import { GoblinWarlock } from '../enemies/GoblinWarlock'
import { Orc } from '../enemies/Orc'
import { Wolf } from '../enemies/Wolf'
import { Bandit } from '../enemies/Bandit'
import type { IEnemy } from '../interfaces/ICharacter'

export type ZoneId = 'mountain-peak' | 'forgotten-castle' | 'crystal-caves'

export type EnemyTier = 'intro' | 'early' | 'mid' | 'late' | 'boss'

export type EnemyCountRange = readonly [number, number]

export interface EnemyPool {
  intro: (() => IEnemy)[]
  early: (() => IEnemy)[]
  mid: (() => IEnemy)[]
  late: (() => IEnemy)[]
  boss: (() => IEnemy)[]
}

export interface ZoneEnemyConfig {
  id: ZoneId
  displayName: string
  pools: EnemyPool
  enemyCountPerTier: Record<EnemyTier, EnemyCountRange>
}

export const DEFAULT_ZONE: ZoneId = 'mountain-peak'

export const ZONE_ENEMY_POOLS: Record<ZoneId, ZoneEnemyConfig> = {
  'mountain-peak': {
    id: 'mountain-peak',
    displayName: 'Monte Pico',
    pools: {
      intro: [
        () => new Goblin(1),
        () => new GoblinArcher(1),
        () => new GoblinWarlock(1)
      ],
      early: [
        () => new Goblin(1),
        () => new Goblin(2),
        () => new GoblinArcher(1),
        () => new GoblinArcher(2),
        () => new GoblinWarlock(1),
        () => new GoblinWarlock(2),
        () => new Wolf(2),
        () => new Bandit(2)
      ],
      mid: [
        () => new Goblin(2),
        () => new Goblin(3),
        () => new GoblinArcher(2),
        () => new GoblinArcher(3),
        () => new GoblinWarlock(2),
        () => new GoblinWarlock(3),
        () => new Wolf(2),
        () => new Wolf(3),
        () => new Bandit(2),
        () => new Bandit(3),
        () => new Orc(3)
      ],
      late: [
        () => new Goblin(3),
        () => new Goblin(4),
        () => new GoblinArcher(3),
        () => new GoblinArcher(4),
        () => new GoblinWarlock(3),
        () => new GoblinWarlock(4),
        () => new Wolf(3),
        () => new Wolf(4),
        () => new Bandit(3),
        () => new Bandit(4),
        () => new Orc(4)
      ],
      boss: [
        () => new Orc(5)
      ]
    },
    enemyCountPerTier: {
      intro: [2, 2],
      early: [2, 2],
      mid: [2, 3],
      late: [3, 4],
      boss: [1, 1]
    }
  },
  'forgotten-castle': {
    id: 'forgotten-castle',
    displayName: 'Castillo Olvidado',
    pools: {
      intro: [
        () => new Goblin(2)
      ],
      early: [
        () => new Goblin(2),
        () => new Goblin(3)
      ],
      mid: [
        () => new Goblin(2),
        () => new Goblin(3)
      ],
      late: [
        () => new Goblin(3),
        () => new Goblin(4)
      ],
      boss: [
        () => new Goblin(5)
      ]
    },
    enemyCountPerTier: {
      intro: [1, 1],
      early: [1, 2],
      mid: [2, 3],
      late: [3, 4],
      boss: [1, 1]
    }
  },
  'crystal-caves': {
    id: 'crystal-caves',
    displayName: 'Cavernas de Cristal',
    pools: {
      intro: [
        () => new Goblin(1)
      ],
      early: [
        () => new Goblin(1)
      ],
      mid: [
        () => new Goblin(1),
        () => new Goblin(2)
      ],
      late: [
        () => new Goblin(2),
        () => new Goblin(3)
      ],
      boss: [
        () => new Goblin(4)
      ]
    },
    enemyCountPerTier: {
      intro: [1, 1],
      early: [1, 2],
      mid: [2, 3],
      late: [3, 4],
      boss: [1, 1]
    }
  }
}

export function determineEnemyTier(floor: number, totalFloors: number): EnemyTier {
  if (floor <= 1) return 'intro'
  if (floor >= totalFloors - 1) return 'boss'
  if (floor >= totalFloors - 3) return 'late'
  if (floor <= 3) return 'early'
  return 'mid'
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function getEnemiesForNode(zoneId: string, floor: number, totalFloors: number): IEnemy[] {
  const zone = ZONE_ENEMY_POOLS[zoneId as ZoneId] ?? ZONE_ENEMY_POOLS[DEFAULT_ZONE]
  const tier = determineEnemyTier(floor, totalFloors)
  const pool = zone.pools[tier]
  const [min, max] = zone.enemyCountPerTier[tier]
  const count = randomInt(min, max)

  const selected: IEnemy[] = []
  for (let i = 0; i < count; i++) {
    const factory = pool[Math.floor(Math.random() * pool.length)]
    selected.push(factory())
  }
  return selected
}
