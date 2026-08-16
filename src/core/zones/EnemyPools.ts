import { Goblin } from '../enemies/Goblin'
import type { IEnemy } from '../interfaces/ICharacter'

export interface EnemyPool {
  early: (() => IEnemy)[]
  mid: (() => IEnemy)[]
  late: (() => IEnemy)[]
  boss: (() => IEnemy)[]
}

export const ZONE_ENEMY_POOLS: Record<string, EnemyPool> = {
  'mountain-peak': {
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
  'forgotten-castle': {
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
  'crystal-caves': {
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
  }
}

export function getEnemiesForNode(zoneId: string, floor: number, totalFloors: number): IEnemy[] {
  const pool = ZONE_ENEMY_POOLS[zoneId]
  if (!pool) {
    return [new Goblin(1)]
  }

  let enemyPool: (() => IEnemy)[]

  if (floor <= 2) {
    enemyPool = pool.early
  } else if (floor >= totalFloors - 1) {
    enemyPool = pool.boss
  } else if (floor >= totalFloors - 3) {
    enemyPool = pool.late
  } else {
    enemyPool = pool.mid
  }

  const numEnemies = floor === 1 ? 2 : Math.floor(Math.random() * 2) + 1
  const selectedEnemies: IEnemy[] = []

  if (floor === 1 && numEnemies === 2 && enemyPool.length >= 2) {
    const shuffledPool = [...enemyPool].sort(() => Math.random() - 0.5)
    selectedEnemies.push(shuffledPool[0]())
    selectedEnemies.push(shuffledPool[1]())
  } else {
    for (let i = 0; i < numEnemies; i++) {
      const randomIndex = Math.floor(Math.random() * enemyPool.length)
      const enemyFactory = enemyPool[randomIndex]
      selectedEnemies.push(enemyFactory())
    }
  }

  return selectedEnemies
}
