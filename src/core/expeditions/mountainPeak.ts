import { MountainEnemy, type MountainRole } from '../enemies/mountainPeak/MountainEnemy'
import { Spectre } from '../enemies/mountainPeak/uniqueEncounters/Spectre'
import { mob } from './encounters'
import type { Encounter, IExpeditionConfig } from './types'
import type { EnemyGroupId } from '../enemies/groups'

const foe = (role: MountainRole, level: number) => () => new MountainEnemy(role, level)
const encounter = (id: string, group: EnemyGroupId, ...members: [MountainRole, number, number?][]): Encounter & { group: EnemyGroupId } => ({
  id, group, mobs: members.map(([role, level, count]) => mob(foe(role, level), count ?? 1))
})

const encounters = {
  'spectral-pass': { id: 'spectral-pass', group: 'skeletons' as const, mobs: [mob(() => new Spectre(3))] },
  'goblin-riders': encounter('goblin-riders', 'goblins', ['goblinRider', 3, 2], ['warlock', 2]),
  'troglodyte-cave': encounter('troglodyte-cave', 'beasts', ['troglodyte', 3], ['lostTroglodyte', 2]),
  'mountain-scarabs': encounter('mountain-scarabs', 'beasts', ['scarab', 2, 3]),
  'trail-scouts': encounter('trail-scouts', 'goblins', ['scout', 1, 2]),
  'light-patrol': encounter('light-patrol', 'goblins', ['bomber', 2], ['archer', 2], ['goblinGuard', 2], ['warlock', 1]),
  'goblin-skirmish': encounter('goblin-skirmish', 'goblins', ['scout', 2, 2], ['goblinGuard', 2], ['warlock', 1]),
  'goblin-cousins': encounter('goblin-cousins', 'goblins', ['scout', 3, 2], ['goblinGuard', 3], ['warlock', 2]),
  'goblin-bombs': encounter('goblin-bombs', 'goblins', ['bomber', 3, 2], ['goblinGuard', 3], ['warlock', 2]),
  'demolition-crew': encounter('demolition-crew', 'goblins', ['bomber', 4, 2], ['goblinGuard', 4], ['warlock', 3]),
  'goblin-warband': encounter('goblin-warband', 'goblins', ['archer', 4, 2], ['scout', 4], ['goblinGuard', 4], ['warlock', 3]),
  'bandit-ambush-3': encounter('bandit-ambush-3', 'bandits', ['banditRaider', 2, 2], ['banditGuard', 2], ['banditMedic', 1]),
  'bandits-debt': encounter('bandits-debt', 'bandits', ['banditArcher', 2], ['banditRaider', 2], ['banditGuard', 2], ['banditMedic', 1]),
  'bandit-patrol': encounter('bandit-patrol', 'bandits', ['banditRaider', 3, 2], ['banditGuard', 3], ['banditMedic', 2]),
  'bandit-firing-line': encounter('bandit-firing-line', 'bandits', ['banditArcher', 3, 2], ['banditGuard', 3], ['banditMedic', 2]),
  'bandit-veterans': encounter('bandit-veterans', 'bandits', ['banditRaider', 4], ['banditArcher', 4], ['banditGuard', 4], ['banditMedic', 3]),
  'bandit-vanguard': encounter('bandit-vanguard', 'bandits', ['banditRaider', 4], ['banditGuard', 4, 2], ['banditMedic', 3]),
  'pass-captain': encounter('pass-captain', 'bandits', ['captain', 4], ['banditRaider', 3], ['banditArcher', 3], ['banditGuard', 3], ['banditMedic', 3]),
  'orc-outriders': encounter('orc-outriders', 'orcs', ['orc', 2], ['orcArcher', 2], ['orcGuard', 2], ['shaman', 1]),
  'orc-spears': encounter('orc-spears', 'orcs', ['orcArcher', 2, 2], ['orcGuard', 2], ['shaman', 1]),
  'shaman-patrol': encounter('shaman-patrol', 'orcs', ['orc', 3], ['orcArcher', 3], ['orcGuard', 2], ['shaman', 2]),
  'orc-raiders': encounter('orc-raiders', 'orcs', ['orc', 3, 2], ['orcGuard', 3], ['shaman', 2]),
  'orc-king-guard': encounter('orc-king-guard', 'orcs', ['orcKing', 3], ['orc', 4], ['orcArcher', 3], ['orcGuard', 3]),
  'orc-assault': encounter('orc-assault', 'orcs', ['orc', 4, 2], ['orcGuard', 4], ['shaman', 3]),
  'summit-guard': encounter('summit-guard', 'orcs', ['orcGuard', 5], ['orcKing', 4], ['orcArcher', 4], ['orc', 4]),
  'bone-patrol': encounter('bone-patrol', 'skeletons', ['skeleton', 2], ['skeletonArcher', 2], ['deathKnight', 1], ['skeletonKing', 1]),
  'bone-line': encounter('bone-line', 'skeletons', ['skeleton', 2, 2], ['deathKnight', 1], ['skeletonKing', 1]),
  'bone-legion': encounter('bone-legion', 'skeletons', ['skeleton', 3], ['skeletonArcher', 3], ['deathKnight', 3], ['skeletonKing', 2]),
  'bone-bows': encounter('bone-bows', 'skeletons', ['skeletonArcher', 3, 2], ['deathKnight', 3], ['skeletonKing', 2]),
  'frozen-crypt': encounter('frozen-crypt', 'skeletons', ['skeletonKing', 3], ['deathKnight', 4], ['skeletonArcher', 4], ['skeleton', 4]),
  'bone-knights': encounter('bone-knights', 'skeletons', ['skeleton', 4], ['deathKnight', 4, 2], ['skeletonKing', 3]),
  'kobold-workers': encounter('kobold-workers', 'kobolds', ['koboldMiner', 2], ['koboldTrapper', 2], ['koboldGuard', 2], ['koboldWarlock', 1]),
  'kobold-traps': encounter('kobold-traps', 'kobolds', ['koboldTrapper', 2, 2], ['koboldGuard', 2], ['koboldWarlock', 1]),
  'kobold-mine': encounter('kobold-mine', 'kobolds', ['koboldMiner', 3], ['koboldTrapper', 3], ['koboldGuard', 2], ['koboldWarlock', 2]),
  'kobold-excavation': encounter('kobold-excavation', 'kobolds', ['koboldMiner', 3, 2], ['koboldGuard', 3], ['koboldWarlock', 2]),
  'stone-watch': encounter('stone-watch', 'kobolds', ['koboldGuard', 4], ['koboldMiner', 3], ['koboldWarlock', 3], ['koboldTrapper', 3]),
  'kobold-sappers': encounter('kobold-sappers', 'kobolds', ['koboldTrapper', 4, 2], ['koboldGuard', 4], ['koboldWarlock', 3]),
  'hill-pack': encounter('hill-pack', 'beasts', ['wolf', 2, 2], ['bear', 2], ['packLeader', 1]),
  'valley-hunt': encounter('valley-hunt', 'beasts', ['wolf', 2], ['bear', 2, 2], ['packLeader', 1]),
  'wolf-pack': encounter('wolf-pack', 'beasts', ['wolf', 3, 2], ['bear', 3], ['packLeader', 2]),
  'bear-den': encounter('bear-den', 'beasts', ['wolf', 3], ['bear', 3, 2], ['packLeader', 2]),
  'high-pack': encounter('high-pack', 'beasts', ['wolf', 4, 3], ['bear', 4], ['packLeader', 3]),
  'bear-hunters': encounter('bear-hunters', 'beasts', ['wolf', 4], ['bear', 4, 2], ['packLeader', 3]),
  'stone-guardians-2': encounter('stone-guardians-2', 'stone', ['guardian', 2], ['stoneShard', 2], ['stoneCaller', 1]),
  'stone-circle': encounter('stone-circle', 'stone', ['elemental', 2], ['stoneShard', 2, 2], ['stoneCaller', 1]),
  'stone-patrol': encounter('stone-patrol', 'stone', ['guardian', 3], ['stoneShard', 3, 2], ['stoneCaller', 2]),
  'stone-rubble': encounter('stone-rubble', 'stone', ['elemental', 3], ['stoneShard', 3], ['stoneCaller', 2]),
  'stone-choir': encounter('stone-choir', 'stone', ['guardian', 4], ['stoneShard', 4, 2], ['stoneCaller', 3]),
  'stone-siege': encounter('stone-siege', 'stone', ['elemental', 4, 2], ['stoneShard', 4], ['stoneCaller', 3]),
  'goblin-duo': encounter('goblin-duo', 'goblins', ['scout', 2], ['warlock', 1]),
  'goblin-trio': encounter('goblin-trio', 'goblins', ['scout', 2], ['archer', 2], ['warlock', 1]),
  'goblin-hex-patrol': encounter('goblin-hex-patrol', 'goblins', ['scout', 3], ['warlock', 2]),
  'goblin-slingers': encounter('goblin-slingers', 'goblins', ['archer', 3, 2], ['scout', 3]),
  'royal-escort': encounter('royal-escort', 'goblins', ['goblinGuard', 4], ['warlock', 4]),
  'goblin-slinging-trio': encounter('goblin-slinging-trio', 'goblins', ['archer', 4, 2], ['bomber', 4]),
  'bandit-duo': encounter('bandit-duo', 'bandits', ['banditRaider', 2], ['banditArcher', 2]),
  'bandit-trio': encounter('bandit-trio', 'bandits', ['banditRaider', 2], ['banditArcher', 2], ['banditMedic', 1]),
  'bandit-pursuit': encounter('bandit-pursuit', 'bandits', ['banditRaider', 3, 2]),
  'bandit-firing-trio': encounter('bandit-firing-trio', 'bandits', ['banditArcher', 3, 2], ['banditRaider', 3]),
  'bandit-elite-duo': encounter('bandit-elite-duo', 'bandits', ['banditGuard', 4], ['banditMedic', 4]),
  'bandit-trio-veterans': encounter('bandit-trio-veterans', 'bandits', ['banditRaider', 5], ['banditArcher', 5], ['banditMedic', 4]),
  'orc-pair': encounter('orc-pair', 'orcs', ['orc', 2], ['orcArcher', 2]),
  'orc-scouting-party': encounter('orc-scouting-party', 'orcs', ['orc', 2], ['orcArcher', 2], ['shaman', 1]),
  'orc-warriors': encounter('orc-warriors', 'orcs', ['orc', 3, 2]),
  'orc-trio': encounter('orc-trio', 'orcs', ['orc', 3], ['orcArcher', 3, 2]),
  'orc-raiding-pair': encounter('orc-raiding-pair', 'orcs', ['orcKing', 4], ['shaman', 4]),
  'orc-raiding-party': encounter('orc-raiding-party', 'orcs', ['orc', 4], ['orcArcher', 4], ['shaman', 4]),
  'bone-pair': encounter('bone-pair', 'skeletons', ['skeleton', 2], ['skeletonArcher', 2]),
  'bone-archers': encounter('bone-archers', 'skeletons', ['skeletonArcher', 2, 2]),
  'bone-trio': encounter('bone-trio', 'skeletons', ['skeleton', 2, 2], ['skeletonArcher', 2]),
  'bone-vanguard': encounter('bone-vanguard', 'skeletons', ['deathKnight', 3], ['skeletonArcher', 3]),
  'bone-line-trio': encounter('bone-line-trio', 'skeletons', ['skeleton', 3], ['skeletonArcher', 3, 2]),
  'bone-royal-pair': encounter('bone-royal-pair', 'skeletons', ['skeletonKing', 4], ['deathKnight', 4]),
  'bone-trio-late': encounter('bone-trio-late', 'skeletons', ['skeletonKing', 4], ['skeletonArcher', 4, 2]),
  'kobold-pair': encounter('kobold-pair', 'kobolds', ['koboldMiner', 2], ['koboldTrapper', 2]),
  'kobold-trap-setting': encounter('kobold-trap-setting', 'kobolds', ['koboldTrapper', 2, 2]),
  'kobold-mining-party': encounter('kobold-mining-party', 'kobolds', ['koboldMiner', 2], ['koboldTrapper', 2], ['koboldWarlock', 1]),
  'kobold-scout-pair': encounter('kobold-scout-pair', 'kobolds', ['koboldMiner', 3], ['koboldWarlock', 2]),
  'kobold-trio': encounter('kobold-trio', 'kobolds', ['koboldTrapper', 3, 2], ['koboldMiner', 3]),
  'kobold-warlock-trio': encounter('kobold-warlock-trio', 'kobolds', ['koboldWarlock', 4, 3]),
  'kobold-mining-trio': encounter('kobold-mining-trio', 'kobolds', ['koboldMiner', 4, 3]),
  'wolf-pair': encounter('wolf-pair', 'beasts', ['wolf', 2, 2], ['bear', 2]),
  'bear-and-pack': encounter('bear-and-pack', 'beasts', ['bear', 2], ['wolf', 2], ['packLeader', 1]),
  'alpha-pair': encounter('alpha-pair', 'beasts', ['wolf', 3], ['packLeader', 2]),
  'wolves-and-bears': encounter('wolves-and-bears', 'beasts', ['wolf', 3, 2], ['bear', 3]),
  'triple-bears': encounter('triple-bears', 'beasts', ['bear', 4, 3]),
  'alpha-and-wolf': encounter('alpha-and-wolf', 'beasts', ['packLeader', 4], ['wolf', 4]),
  'stone-shard-pair': encounter('stone-shard-pair', 'stone', ['stoneShard', 2, 2]),
  'stone-trio': encounter('stone-trio', 'stone', ['elemental', 2], ['stoneShard', 2, 2]),
  'triple-golems': encounter('triple-golems', 'stone', ['guardian', 3, 3]),
  'stone-caller-pair': encounter('stone-caller-pair', 'stone', ['guardian', 3], ['stoneCaller', 2]),
  'triple-golems-late': encounter('triple-golems-late', 'stone', ['guardian', 4, 3]),
  'summit-dragon': encounter('summit-dragon', 'dragons', ['dragon', 5]),
  'dragon-mother-arrives': encounter('dragon-mother-arrives', 'dragons', ['dragon', 5])
}

export const MOUNTAIN_PEAK: IExpeditionConfig = {
  id: 'mountain-peak', displayName: 'Montañas Rocosas',
  description: 'El paso está defendido por patrullas coordinadas. Reúne experiencia, equipo y aliados antes de desafiar al capitán; la compañía conserva su progreso al caer.',
  totalFloors: 10, unlockCriteria: { kind: 'always' },
  presentation: { difficulty: 'medium', background: '', rewards: { experience: 172, gold: 100 } },
  groupPools: {
    intro: ['goblins'], early: ['goblins', 'bandits', 'orcs', 'skeletons', 'kobolds', 'beasts', 'stone'],
    mid: ['goblins', 'bandits', 'orcs', 'skeletons', 'kobolds', 'beasts', 'stone'],
    late: ['goblins', 'bandits', 'orcs', 'skeletons', 'kobolds', 'beasts', 'stone'], boss: ['dragons']
  },
  enemyGroups: {
    goblins: { intro: ['trail-scouts'], early: ['light-patrol', 'goblin-skirmish', 'goblin-duo', 'goblin-trio'], mid: ['goblin-cousins', 'goblin-bombs', 'goblin-hex-patrol', 'goblin-slingers', 'goblin-riders'], late: ['demolition-crew', 'goblin-warband', 'royal-escort', 'goblin-slinging-trio'] },
    bandits: { early: ['bandit-ambush-3', 'bandits-debt', 'bandit-duo', 'bandit-trio'], mid: ['bandit-patrol', 'bandit-firing-line', 'bandit-pursuit', 'bandit-firing-trio'], late: ['bandit-veterans', 'bandit-vanguard', 'bandit-elite-duo', 'bandit-trio-veterans'] },
    orcs: { early: ['orc-outriders', 'orc-spears', 'orc-pair', 'orc-scouting-party'], mid: ['shaman-patrol', 'orc-raiders', 'orc-warriors', 'orc-trio'], late: ['orc-king-guard', 'orc-assault', 'orc-raiding-pair', 'orc-raiding-party'] },
    skeletons: { early: ['bone-patrol', 'bone-line', 'bone-pair', 'bone-archers', 'bone-trio'], mid: ['bone-legion', 'bone-bows', 'bone-vanguard', 'bone-line-trio'], late: ['frozen-crypt', 'bone-knights', 'bone-royal-pair', 'bone-trio-late'] },
    kobolds: { early: ['kobold-workers', 'kobold-traps', 'kobold-pair', 'kobold-trap-setting', 'kobold-mining-party'], mid: ['kobold-mine', 'kobold-excavation', 'kobold-scout-pair', 'kobold-trio'], late: ['stone-watch', 'kobold-sappers', 'kobold-warlock-trio', 'kobold-mining-trio'] },
    beasts: { early: ['hill-pack', 'valley-hunt', 'wolf-pair', 'bear-and-pack', 'mountain-scarabs'], mid: ['wolf-pack', 'bear-den', 'alpha-pair', 'wolves-and-bears', 'troglodyte-cave'], late: ['high-pack', 'bear-hunters', 'triple-bears', 'alpha-and-wolf'] },
    stone: { early: ['stone-guardians-2', 'stone-circle', 'stone-shard-pair', 'stone-trio'], mid: ['stone-patrol', 'stone-rubble', 'triple-golems'], late: ['stone-choir', 'stone-siege', 'stone-caller-pair', 'triple-golems-late'] },
    dragons: { boss: ['summit-dragon'] }
  },
  encounters,
  recruitableHeroIds: ['warrior', 'cleric', 'rogue'],
  curiosityEvents: [
    { id: 'spectral-pass', uniquePerRun: true, inescapable: true, title: 'Algo se acerca', flavor: 'Los pasos cesan. El aire se enfría. Algo se acerca por el sendero. CORRE.',
      choices: [1, 2, 3].map(index => ({ id: `run-${index}`, label: 'CORRER', outcome: { kind: 'ambush' as const, encounter: 'spectral-pass', flavor: 'No importa hacia dónde corráis. El espectro ya está aquí.' } }))
    },
    { id: 'abandoned-cache', title: 'El alijo del sendero', flavor: 'Un cofre junto a las huellas de una patrulla.', choices: [
      { id: 'supplies', label: 'Recoger vendas y marcharse', outcome: { kind: 'reward', effects: [{ kind: 'grantItem', itemId: 'bandages' }], flavor: 'Guardáis vendas en la bolsa compartida.' } },
      { id: 'risk', label: 'Buscar monedas: perder 15 HP por héroe y ganar 25 oro', outcome: { kind: 'reward', effects: [{ kind: 'damage', amount: 15 }, { kind: 'gold', amount: 25 }], flavor: 'Las zarzas cortan, pero encontráis una bolsa de monedas.' } }
    ] },
    { id: 'mountain-spring', title: 'Manantial de montaña', flavor: 'El agua limpia invita a recuperar fuerzas.', choices: [
      { id: 'rest', label: 'Descansar: recuperar 30 HP y 15 energía por héroe', outcome: { kind: 'reward', effects: [{ kind: 'heal', amount: 30 }, { kind: 'restoreEnergy', amount: 15 }], flavor: 'La compañía respira y continúa.' } },
      { id: 'learn', label: 'Estudiar las runas: ganar 25 XP por héroe', outcome: { kind: 'reward', effects: [{ kind: 'xp', amount: 25 }], flavor: 'Las marcas enseñan cómo combatir a los guardianes.' } }
    ] },
    { id: 'patrol-bounty', title: 'Recompensa por la patrulla', flavor: 'Un viajero os ofrece un encargo peligroso.', choices: [
      { id: 'fight', label: 'Arriesgarse: combatir una patrulla de bandidos', outcome: { kind: 'ambush', group: 'bandits', flavor: 'Los bandidos os cortan el paso. Ganad para cobrar su botín.' } },
      { id: 'leave', label: 'Continuar sin combatir', outcome: { kind: 'noop', flavor: 'Elegís guardar fuerzas para la cima.' } }
    ] },
    { id: 'occupied-mine', title: 'La mina ocupada', flavor: 'Unos kobolds vigilan la entrada de una mina. Dentro resuenan picos y órdenes de un capataz.', choices: [
      { id: 'fight', label: 'Desalojar a los kobolds', outcome: { kind: 'ambush', group: 'kobolds', flavor: 'La cuadrilla abandona las herramientas y defiende su mina.' } },
      { id: 'leave', label: 'Rodear la mina', outcome: { kind: 'noop', flavor: 'Dejáis atrás el ruido de los picos.' } }
    ] },
    { id: 'restless-crypt', title: 'La cripta abierta', flavor: 'Tras una losa rota veis huesos armados. Una corona se mueve entre las sombras.', choices: [
      { id: 'fight', label: 'Entrar en la cripta', outcome: { kind: 'ambush', group: 'skeletons', flavor: 'Los esqueletos se forman ante su rey.' } },
      { id: 'leave', label: 'No despertar a los muertos', outcome: { kind: 'noop', flavor: 'La losa vuelve a cerrar el paso.' } }
    ] },
    { id: 'orc-checkpoint', title: 'El puesto orco', flavor: 'Un estandarte orco bloquea el sendero. Sus arqueros apuntan desde las rocas.', choices: [
      { id: 'fight', label: 'Romper el bloqueo orco', outcome: { kind: 'ambush', group: 'orcs', flavor: 'El chamán ordena a los orcos defender el puesto.' } },
      { id: 'leave', label: 'Buscar otro sendero', outcome: { kind: 'noop', flavor: 'La patrulla os pierde de vista entre los riscos.' } }
    ] },
    { id: 'stone-sanctuary', title: 'El santuario pétreo', flavor: 'Las estatuas se inclinan hacia un núcleo de roca que late bajo el altar.', choices: [
      { id: 'fight', label: 'Acercarse al núcleo', outcome: { kind: 'ambush', group: 'stone', flavor: 'Los guardianes de piedra despiertan alrededor del altar.' } },
      { id: 'leave', label: 'Dejar intacto el santuario', outcome: { kind: 'noop', flavor: 'Os alejáis antes de despertar a las estatuas.' } }
    ] },
    { id: 'mountain-den', title: 'Huellas en la nieve', flavor: 'Un lobo alfa vigila una hondonada. Cerca hay huellas de oso y restos de una presa.', choices: [
      { id: 'fight', label: 'Atravesar el territorio de las bestias', outcome: { kind: 'ambush', group: 'beasts', flavor: 'Los animales defienden su territorio al oír el aullido del alfa.' } },
      { id: 'leave', label: 'Alejarse de las huellas', outcome: { kind: 'noop', flavor: 'La manada se queda junto a su presa.' } }
    ] },
    { id: 'goblin-camp', title: 'Mechas junto al fuego', flavor: 'Unos goblins preparan bombas alrededor de una hoguera. Su guardia vigila un montón de sacos.', choices: [
      { id: 'fight', label: 'Asaltar el campamento goblin', outcome: { kind: 'ambush', group: 'goblins', flavor: 'La guardia y los bombarderos acuden al grito del hechicero.' } },
      { id: 'leave', label: 'Pasar sin ser vistos', outcome: { kind: 'noop', flavor: 'Dejáis la hoguera atrás.' } }
    ] }
  ],
  generator: {
    // SOLO PARA PRUEBAS: aparición garantizada. Restaurar chance: 0.1 al terminar.
    haunting: { chance: 1, eventId: 'spectral-pass', depth: 3 },
    minNodesBeforeBoss: 8, shopChance: 0.15, curiosityChance: 0.2,
    maxRetries: 50, maxParentsPerNode: 2, proximityThreshold: 40, maxPathsPerRow: 4,
    forcedSingleRows: [2, 3, 5, 6, 8], forcedCombatRows: [1, 5, 8],
    forcedNodes: [
      { row: 0, type: 'combat', encounter: 'trail-scouts' },
      { row: 1, type: 'combat' },
      { row: 3, type: 'shop' },
      { row: 5, type: 'combat', encounter: 'pass-captain' },
      { row: 6, type: 'curiosity' },
      { row: 8, type: 'combat' },
      { row: 9, type: 'boss', encounter: 'summit-dragon' }
    ],
    progressionGate: { nodeId: 'node-5', minimumAttempts: 2 },
    recruitHeroRow: 2, minCuriosityNodes: 1, maxCuriosityNodes: 4, maxConsecutiveCuriosity: 1,
    minShopNodes: 1, maxShopNodes: 3, maxConsecutiveShop: 1
  }
}
