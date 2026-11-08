import { MountainEnemy, type MountainRole } from '../enemies/MountainEnemy'
import { mob, roster } from './encounters'
import type { Encounter, IExpeditionConfig } from './types'

const foe = (role: MountainRole, level: number) => () => new MountainEnemy(role, level)
const encounter = (id: string, ...members: [MountainRole, number, number?][]): Encounter => ({
  id, mobs: members.map(([role, level, count]) => mob(foe(role, level), count ?? 1))
})

const encounters = {
  'trail-scouts': encounter('trail-scouts', ['scout', 1, 2]),
  'light-patrol': encounter('light-patrol', ['bomber', 2], ['archer', 2], ['guardian', 2], ['warlock', 1]),
  'kobold-workers': encounter('kobold-workers', ['koboldMiner', 2], ['koboldTrapper', 2], ['bear', 2], ['koboldWarlock', 1]),
  'bone-patrol': encounter('bone-patrol', ['skeleton', 2], ['skeletonArcher', 2], ['deathKnight', 1], ['warlock', 1]),
  'orc-outriders': encounter('orc-outriders', ['orc', 2], ['orcArcher', 2], ['guardian', 2], ['shaman', 1]),
  'wolf-pack': encounter('wolf-pack', ['wolf', 3, 2], ['guardian', 3], ['shaman', 2]),
  'shaman-patrol': encounter('shaman-patrol', ['orc', 3], ['bomber', 3], ['elemental', 2], ['shaman', 2]),
  'bone-legion': encounter('bone-legion', ['skeleton', 3], ['skeletonArcher', 3], ['deathKnight', 3], ['skeletonKing', 2]),
  'kobold-mine': encounter('kobold-mine', ['koboldMiner', 3], ['koboldTrapper', 3], ['elemental', 2], ['koboldWarlock', 2]),
  'bear-den': encounter('bear-den', ['wolf', 3], ['bomber', 2], ['bear', 3], ['warlock', 2]),
  'pass-captain': encounter('pass-captain', ['captain', 4], ['scout', 3], ['archer', 3], ['guardian', 3], ['shaman', 3]),
  'stone-watch': encounter('stone-watch', ['elemental', 4], ['koboldMiner', 3], ['koboldWarlock', 3], ['koboldTrapper', 3]),
  'orc-king-guard': encounter('orc-king-guard', ['orcKing', 3], ['orc', 4], ['orcArcher', 3], ['deathKnight', 3]),
  'frozen-crypt': encounter('frozen-crypt', ['skeletonKing', 3], ['deathKnight', 4], ['skeletonArcher', 4], ['skeleton', 4]),
  'demolition-crew': encounter('demolition-crew', ['bomber', 4, 2], ['elemental', 4], ['warlock', 3]),
  'high-pack': encounter('high-pack', ['wolf', 4, 2], ['guardian', 4], ['shaman', 3], ['archer', 4]),
  'summit-guard': encounter('summit-guard', ['elemental', 5], ['orcKing', 4], ['orcArcher', 4], ['koboldTrapper', 4]),
  'summit-dragon': encounter('summit-dragon', ['dragon', 5], ['guardian', 5], ['shaman', 4], ['archer', 4]),
  'bandit-ambush-3': encounter('bandit-ambush-3', ['scout', 2, 2], ['archer', 2], ['guardian', 2], ['shaman', 2]),
  'stone-guardians-2': encounter('stone-guardians-2', ['guardian', 3, 2], ['shaman', 2], ['archer', 2]),
  'goblin-cousins': encounter('goblin-cousins', ['scout', 2, 2], ['guardian', 2], ['shaman', 1]),
  'bandits-debt': encounter('bandits-debt', ['scout', 2], ['archer', 2], ['guardian', 2], ['shaman', 2])
}

export const MOUNTAIN_PEAK: IExpeditionConfig = {
  id: 'mountain-peak', displayName: 'Montañas Rocosas',
  description: 'El paso está defendido por patrullas coordinadas. Reúne experiencia, equipo y aliados antes de desafiar al capitán; la compañía conserva su progreso al caer.',
  totalFloors: 10, unlockCriteria: { kind: 'always' },
  presentation: { difficulty: 'medium', background: '', rewards: { experience: 172, gold: 100 } },
  enemyPools: roster({
    intro: [mob(foe('scout', 1))], early: [mob(foe('scout', 2))],
    mid: [mob(foe('wolf', 3))], late: [mob(foe('guardian', 4))], boss: [mob(foe('dragon', 5))]
  }),
  encounterPools: {
    intro: ['trail-scouts'], early: ['light-patrol', 'kobold-workers', 'bone-patrol', 'orc-outriders'],
    mid: ['wolf-pack', 'shaman-patrol', 'bone-legion', 'kobold-mine', 'bear-den'],
    late: ['stone-watch', 'high-pack', 'orc-king-guard', 'frozen-crypt', 'demolition-crew'], boss: ['summit-dragon']
  },
  enemyCountPerTier: { intro: [2, 2], early: [2, 2], mid: [2, 2], late: [2, 3], boss: [1, 1] },
  encounters,
  recruitableHeroIds: ['warrior', 'cleric', 'rogue'],
  curiosityEvents: [
    { id: 'abandoned-cache', title: 'El alijo del sendero', flavor: 'Un cofre junto a las huellas de una patrulla.', choices: [
      { id: 'supplies', label: 'Recoger vendas y marcharse', outcome: { kind: 'reward', effects: [{ kind: 'grantItem', itemId: 'bandages' }], flavor: 'Guardáis vendas en la bolsa compartida.' } },
      { id: 'risk', label: 'Buscar monedas: perder 15 HP por héroe y ganar 25 oro', outcome: { kind: 'reward', effects: [{ kind: 'damage', amount: 15 }, { kind: 'gold', amount: 25 }], flavor: 'Las zarzas cortan, pero encontráis una bolsa de monedas.' } }
    ] },
    { id: 'mountain-spring', title: 'Manantial de montaña', flavor: 'El agua limpia invita a recuperar fuerzas.', choices: [
      { id: 'rest', label: 'Descansar: recuperar 30 HP y 15 energía por héroe', outcome: { kind: 'reward', effects: [{ kind: 'heal', amount: 30 }, { kind: 'restoreEnergy', amount: 15 }], flavor: 'La compañía respira y continúa.' } },
      { id: 'learn', label: 'Estudiar las runas: ganar 25 XP por héroe', outcome: { kind: 'reward', effects: [{ kind: 'xp', amount: 25 }], flavor: 'Las marcas enseñan cómo combatir a los guardianes.' } }
    ] },
    { id: 'patrol-bounty', title: 'Recompensa por la patrulla', flavor: 'Un viajero os ofrece un encargo peligroso.', choices: [
      { id: 'fight', label: 'Arriesgarse: combatir una patrulla con tanque y chamán', outcome: { kind: 'ambush', encounter: 'bandit-ambush-3', flavor: 'La patrulla os encuentra. Ganad para cobrar su botín.' } },
      { id: 'leave', label: 'Continuar sin combatir', outcome: { kind: 'noop', flavor: 'Elegís guardar fuerzas para la cima.' } }
    ] }
  ],
  generator: {
    minNodesBeforeBoss: 8, shopChance: 0.15, curiosityChance: 0.2,
    maxRetries: 50, maxParentsPerNode: 2, proximityThreshold: 40, maxPathsPerRow: 4,
    forcedSingleRows: [2, 3, 5, 6, 8], forcedCombatRows: [1, 5, 8],
    forcedNodes: [
      { row: 0, type: 'combat', encounter: 'trail-scouts' },
      { row: 1, type: 'combat', encounter: 'light-patrol' },
      { row: 3, type: 'shop' },
      { row: 5, type: 'combat', encounter: 'pass-captain' },
      { row: 6, type: 'curiosity' },
      { row: 8, type: 'combat', encounter: 'summit-guard' },
      { row: 9, type: 'boss', encounter: 'summit-dragon' }
    ],
    progressionGate: { nodeId: 'node-5', minimumAttempts: 2 },
    recruitHeroRow: 2, minCuriosityNodes: 1, maxCuriosityNodes: 4, maxConsecutiveCuriosity: 1,
    minShopNodes: 1, maxShopNodes: 3, maxConsecutiveShop: 1
  }
}
