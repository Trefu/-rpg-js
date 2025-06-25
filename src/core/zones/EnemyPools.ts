import { Goblin } from '../enemies/Goblin'
import { Orc } from '../enemies/Orc'
import { Wolf } from '../enemies/Wolf'
import type { IEnemy } from '../interfaces/ICharacter'

export interface EnemyPool {
  early: (() => IEnemy)[]      // Primeros nodos (piso 1-2)
  mid: (() => IEnemy)[]        // Nodos medios (piso 3-4)
  late: (() => IEnemy)[]       // Nodos tardíos (piso 5+)
  boss: (() => IEnemy)[]       // Nodo final
}

// Configuración de enemigos por zona
export const ZONE_ENEMY_POOLS: Record<string, EnemyPool> = {
  'mountain-peak': {
    early: [
      () => new Goblin(1),
      () => new Wolf(1),
      () => new Goblin(1),  // Duplicado para más peso
      () => new Wolf(1)     // Duplicado para más peso
    ],
    mid: [
      () => new Goblin(1),
      () => new Wolf(1),
      () => new Orc(1)
    ],
    late: [
      () => new Orc(1),
      () => new Orc(2),
      () => new Wolf(2),
      () => new Goblin(2)
    ],
    boss: [
      () => new Orc(3)
    ]
  },
  'forgotten-castle': {
    early: [
      () => new Goblin(2),
      () => new Wolf(2)
    ],
    mid: [
      () => new Orc(2),
      () => new Wolf(2),
      () => new Goblin(3)
    ],
    late: [
      () => new Orc(3),
      () => new Orc(4),
      () => new Wolf(3),
      () => new Goblin(4)
    ],
    boss: [
      () => new Orc(5)
    ]
  },
  'crystal-caves': {
    early: [
      () => new Goblin(1),
      () => new Wolf(1)
    ],
    mid: [
      () => new Goblin(1),
      () => new Wolf(1),
      () => new Orc(1)
    ],
    late: [
      () => new Orc(1),
      () => new Orc(2),
      () => new Wolf(2),
      () => new Goblin(2)
    ],
    boss: [
      () => new Orc(2)
    ]
  }
}

// Función para obtener enemigos según la zona y dificultad del nodo
export function getEnemiesForNode(zoneId: string, floor: number, totalFloors: number): IEnemy[] {
  const pool = ZONE_ENEMY_POOLS[zoneId]
  if (!pool) {
    // Fallback a goblin si no hay pool definido
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

  // Seleccionar enemigos aleatoriamente
  const numEnemies = floor === 1 ? 2 : Math.floor(Math.random() * 2) + 1 // 1-2 enemigos
  const selectedEnemies: IEnemy[] = []

  // Para el primer piso, asegurar variedad
  if (floor === 1 && numEnemies === 2 && enemyPool.length >= 2) {
    // Seleccionar dos enemigos diferentes
    const shuffledPool = [...enemyPool].sort(() => Math.random() - 0.5)
    selectedEnemies.push(shuffledPool[0]())
    selectedEnemies.push(shuffledPool[1]())
  } else {
    // Para otros casos, selección aleatoria normal
    for (let i = 0; i < numEnemies; i++) {
      const randomIndex = Math.floor(Math.random() * enemyPool.length)
      const enemyFactory = enemyPool[randomIndex]
      selectedEnemies.push(enemyFactory())
    }
  }

  return selectedEnemies
} 