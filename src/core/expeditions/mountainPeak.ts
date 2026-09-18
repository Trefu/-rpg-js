import { Goblin } from '@/core/enemies/Goblin'
import { GoblinArcher } from '@/core/enemies/GoblinArcher'
import { GoblinWarlock } from '@/core/enemies/GoblinWarlock'
import { Wolf } from '@/core/enemies/Wolf'
import { Bandit } from '@/core/enemies/Bandit'
import { Orc } from '@/core/enemies/Orc'
import { BanditCaptain } from '@/core/enemies/BanditCaptain'
import { Dragon } from '@/core/enemies/Dragon'
import { elite } from '@/core/zones/EnemyPools'
import { mob } from './encounters'
import type { IExpeditionConfig } from './types'

/**
 * Primera expedicion jugable: "Montanas Rocosas". Migracion directa de
 * lo que antes vivia en `ZONE_ENEMY_POOLS['mountain-peak']` + `ZONES['mountain-peak']`
 * + el `CONFIG` del generador + los 5 ambush encounters nombrados en el
 * plan (bandit-ambush-3, stone-guardians-2, dragon-mother-arrives,
 * goblin-cousins, bandits-debt).
 *
 * Notas sobre las sustituciones:
 * - `stone-guardians-2` usa `Orc` como placeholder visual hasta que
 *   exista una clase `Golem`. La cantidad (2) y el nivel son los que
 *   tendria un guardian de piedra de runa media.
 */
export const MOUNTAIN_PEAK: IExpeditionConfig = {
  id: 'mountain-peak',
  displayName: 'Montañas Rocosas',
  description:
    'Una montana escarpada con ruinas antiguas en la cima. Ideal para una primera expedicion.',
  totalFloors: 10,
  unlockCriteria: { kind: 'always' },
  presentation: {
    difficulty: 'easy',
    background: '',
    rewards: { experience: 500, gold: 1200 }
  },

  enemyPools: {
    intro: [
      () => new Goblin(1),
      () => new Goblin(1)
    ],
    early: [
      () => new Goblin(3),
      () => new Goblin(3),
      () => new GoblinArcher(3),
      () => new GoblinArcher(3),
      () => new GoblinWarlock(3),
      () => new GoblinWarlock(3)
    ],
    mid: [
      () => new Wolf(5),
      () => new Wolf(5),
      () => new Wolf(5),
      () => new Bandit(5),
      () => new Bandit(5),
      () => new Bandit(5),
      () => new Orc(5),
      () => new Orc(5),
      () => new Orc(5),
      elite('bandit-captain', () => new BanditCaptain(5))
    ],
    late: [
      () => new Wolf(5),
      () => new Wolf(5),
      () => new Wolf(5),
      () => new Bandit(5),
      () => new Bandit(5),
      () => new Bandit(5),
      () => new Orc(5),
      () => new Orc(5),
      () => new Orc(5),
      () => new Orc(5),
      elite('bandit-captain', () => new BanditCaptain(6))
    ],
    boss: [() => new Dragon(8)]
  },

  enemyCountPerTier: {
    intro: [2, 2],
    early: [2, 2],
    mid: [3, 3],
    late: [3, 5],
    boss: [1, 1]
  },

  /**
   * Encounters fijos referenciables desde outcomes `ambush` de
   * `SHARED_CURIOSITY_EVENTS` y (eventualmente) desde `forcedNodes`
   * del generador. Mantener este catalogo junto a la expedicion
   * facilita ver, de un vistazo, que encuentros narrativos dispara
   * este dungeon.
   */
  encounters: {
    'bandit-ambush-3': {
      id: 'bandit-ambush-3',
      flavor: 'Tres bandidos salen de entre los arbustos con los cuchillos desenvainados.',
      mobs: [mob(() => new Bandit(4), 3)]
    },
    'stone-guardians-2': {
      id: 'stone-guardians-2',
      flavor: 'Dos guardianes de piedra avanzan hacia ti desde la camara.',
      mobs: [mob(() => new Orc(6), 2)]
    },
    'dragon-mother-arrives': {
      id: 'dragon-mother-arrives',
      flavor: 'La madre dragon aterriza frente a la cria con un rugido que sacude las paredes.',
      mobs: [mob(() => new Dragon(7))]
    },
    'goblin-cousins': {
      id: 'goblin-cousins',
      flavor: 'Tres goblins del mercader caen sobre ti con cuchillos oxidados.',
      mobs: [mob(() => new Goblin(4), 3)]
    },
    'bandits-debt': {
      id: 'bandits-debt',
      flavor: 'Dos bandidos salen de entre el publico para cobrar la deuda del bardo.',
      mobs: [mob(() => new Bandit(5), 2)]
    }
  },

  generator: {
    minNodesBeforeBoss: 8,
    shopChance: 0.15,
    curiosityChance: 0.1,
    maxRetries: 50,
    maxParentsPerNode: 2,
    proximityThreshold: 40,
    forcedSingleRows: [5],
    forcedCombatRows: [0, 1],
    forcedNodes: [],
    recruitHeroRow: 2,
    minCuriosityNodes: 2,
    maxCuriosityNodes: 4,
    maxConsecutiveCuriosity: 2,
    minShopNodes: 1,
    maxShopNodes: 2,
    maxConsecutiveShop: 1
  }
}
