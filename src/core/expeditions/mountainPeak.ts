import { MountainEnemy, type MountainRole } from '../enemies/mountainPeak/MountainEnemy'
import { Spectre } from '../enemies/mountainPeak/uniqueEncounters/Spectre'
import { mob } from './encounters'
import type { Encounter, IExpeditionConfig } from './types'
import type { EnemyGroupId } from '../enemies/groups'

/**
 * Buff global de niveles por tramo: medio, tardío y jefe suben un nivel
 * sobre su valor base. Intro y tramo temprano se quedan igual para que la
 * primera victoria siga siendo alcanzable sin equipo.
 */
const TIER_LEVEL_BUFF: Record<string, number> = { intro: 0, early: 0, mid: 1, late: 1, boss: 1, special: 0 }
const encounter = (tier: keyof typeof TIER_LEVEL_BUFF, id: string, group: EnemyGroupId,
  ...members: [MountainRole, number, number?][]): Encounter & { group: EnemyGroupId } => ({
  id, group, mobs: members.map(([role, level, count]) => mob(() => new MountainEnemy(role, level + TIER_LEVEL_BUFF[tier]), count ?? 1))
})

const encounters = {
  'spectral-pass': { id: 'spectral-pass', group: 'skeletons' as const, mobs: [mob(() => new Spectre())] },
  'goblin-riders': encounter('mid', 'goblin-riders', 'goblins', ['goblinRider', 3, 2], ['warlock', 2]),
  'mountain-scarabs': encounter('early', 'mountain-scarabs', 'beasts', ['scarab', 2, 3]),
  'trail-scouts': encounter('intro', 'trail-scouts', 'goblins', ['scout', 1, 2]),
  'light-patrol': encounter('early', 'light-patrol', 'goblins', ['bomber', 2], ['archer', 2], ['goblinGuard', 2], ['warlock', 1]),
  'goblin-skirmish': encounter('early', 'goblin-skirmish', 'goblins', ['scout', 2, 2], ['goblinGuard', 2], ['warlock', 1]),
  'goblin-cousins': encounter('mid', 'goblin-cousins', 'goblins', ['scout', 3, 2], ['goblinGuard', 3], ['warlock', 2]),
  'goblin-bombs': encounter('mid', 'goblin-bombs', 'goblins', ['bomber', 3, 2], ['goblinGuard', 3], ['warlock', 2]),
  'demolition-crew': encounter('late', 'demolition-crew', 'goblins', ['bomber', 4, 2], ['goblinGuard', 4], ['warlock', 3]),
  'goblin-warband': encounter('late', 'goblin-warband', 'goblins', ['archer', 4, 2], ['scout', 4], ['goblinGuard', 4], ['warlock', 3]),
  'bandit-ambush-3': encounter('early', 'bandit-ambush-3', 'bandits', ['banditRaider', 2, 2], ['banditGuard', 2], ['banditMedic', 1]),
  'bandits-debt': encounter('early', 'bandits-debt', 'bandits', ['banditArcher', 2], ['banditRaider', 2], ['banditGuard', 2], ['banditMedic', 1]),
  'bandit-patrol': encounter('mid', 'bandit-patrol', 'bandits', ['banditRaider', 3, 2], ['banditGuard', 3], ['banditMedic', 2]),
  'bandit-firing-line': encounter('mid', 'bandit-firing-line', 'bandits', ['banditArcher', 3, 2], ['banditGuard', 3], ['banditMedic', 2]),
  'bandit-veterans': encounter('late', 'bandit-veterans', 'bandits', ['banditRaider', 4], ['banditArcher', 4], ['banditGuard', 4], ['banditMedic', 3]),
  'bandit-vanguard': encounter('late', 'bandit-vanguard', 'bandits', ['banditRaider', 4], ['banditGuard', 4, 2], ['banditMedic', 3]),
  'pass-captain': encounter('early', 'pass-captain', 'bandits', ['captain', 4], ['banditRaider', 3], ['banditArcher', 3], ['banditGuard', 3], ['banditMedic', 3]),
  'orc-outriders': encounter('early', 'orc-outriders', 'orcs', ['orc', 2], ['orcArcher', 2], ['orcGuard', 2], ['shaman', 1]),
  'orc-spears': encounter('early', 'orc-spears', 'orcs', ['orcArcher', 2, 2], ['orcGuard', 2], ['shaman', 1]),
  'shaman-patrol': encounter('mid', 'shaman-patrol', 'orcs', ['orc', 3], ['orcArcher', 3], ['orcGuard', 2], ['shaman', 2]),
  'orc-raiders': encounter('mid', 'orc-raiders', 'orcs', ['orc', 3, 2], ['orcGuard', 3], ['shaman', 2]),
  'orc-king-guard': encounter('late', 'orc-king-guard', 'orcs', ['orcKing', 3], ['orc', 4], ['orcArcher', 3], ['orcGuard', 3]),
  'orc-assault': encounter('late', 'orc-assault', 'orcs', ['orc', 4, 2], ['orcGuard', 4], ['shaman', 3]),
  'summit-guard': encounter('early', 'summit-guard', 'orcs', ['orcGuard', 5], ['orcKing', 4], ['orcArcher', 4], ['orc', 4]),
  'bone-patrol': encounter('early', 'bone-patrol', 'skeletons', ['skeleton', 2], ['skeletonArcher', 2], ['deathKnight', 1], ['skeletonKing', 1]),
  'bone-line': encounter('early', 'bone-line', 'skeletons', ['skeleton', 2, 2], ['deathKnight', 1], ['skeletonKing', 1]),
  'bone-legion': encounter('mid', 'bone-legion', 'skeletons', ['skeleton', 3], ['skeletonArcher', 3], ['deathKnight', 3], ['skeletonKing', 2]),
  'bone-bows': encounter('mid', 'bone-bows', 'skeletons', ['skeletonArcher', 3, 2], ['deathKnight', 3], ['skeletonKing', 2]),
  'frozen-crypt': encounter('late', 'frozen-crypt', 'skeletons', ['skeletonKing', 3], ['deathKnight', 4], ['skeletonArcher', 4], ['skeleton', 4]),
  'bone-knights': encounter('late', 'bone-knights', 'skeletons', ['skeleton', 4], ['deathKnight', 4, 2], ['skeletonKing', 3]),
  'kobold-workers': encounter('early', 'kobold-workers', 'kobolds', ['koboldMiner', 2], ['koboldTrapper', 2], ['koboldGuard', 2], ['koboldWarlock', 1]),
  'kobold-traps': encounter('early', 'kobold-traps', 'kobolds', ['koboldTrapper', 2, 2], ['koboldGuard', 2], ['koboldWarlock', 1]),
  'kobold-mine': encounter('mid', 'kobold-mine', 'kobolds', ['koboldMiner', 3], ['koboldTrapper', 3], ['koboldGuard', 2], ['koboldWarlock', 2]),
  'kobold-excavation': encounter('mid', 'kobold-excavation', 'kobolds', ['koboldMiner', 3, 2], ['koboldGuard', 3], ['koboldWarlock', 2]),
  'stone-watch': encounter('late', 'stone-watch', 'kobolds', ['koboldGuard', 4], ['koboldMiner', 3], ['koboldWarlock', 3], ['koboldTrapper', 3]),
  'kobold-sappers': encounter('late', 'kobold-sappers', 'kobolds', ['koboldTrapper', 4, 2], ['koboldGuard', 4], ['koboldWarlock', 3]),
  'hill-pack': encounter('early', 'hill-pack', 'beasts', ['wolf', 2, 2], ['bear', 2], ['packLeader', 1]),
  'valley-hunt': encounter('early', 'valley-hunt', 'beasts', ['wolf', 2], ['bear', 2, 2], ['packLeader', 1]),
  'wolf-pack': encounter('mid', 'wolf-pack', 'beasts', ['wolf', 3, 2], ['bear', 3], ['packLeader', 2]),
  'bear-den': encounter('mid', 'bear-den', 'beasts', ['wolf', 3], ['bear', 3, 2], ['packLeader', 2]),
  'high-pack': encounter('late', 'high-pack', 'beasts', ['wolf', 4, 3], ['bear', 4], ['packLeader', 3]),
  'bear-hunters': encounter('late', 'bear-hunters', 'beasts', ['wolf', 4], ['bear', 4, 2], ['packLeader', 3]),
  'stone-guardians-2': encounter('early', 'stone-guardians-2', 'stone', ['guardian', 2], ['stoneShard', 2], ['stoneCaller', 1]),
  'stone-circle': encounter('early', 'stone-circle', 'stone', ['elemental', 2], ['stoneShard', 2, 2], ['stoneCaller', 1]),
  'stone-patrol': encounter('mid', 'stone-patrol', 'stone', ['guardian', 3], ['stoneShard', 3, 2], ['stoneCaller', 2]),
  'stone-rubble': encounter('mid', 'stone-rubble', 'stone', ['elemental', 3], ['stoneShard', 3], ['stoneCaller', 2]),
  'stone-choir': encounter('late', 'stone-choir', 'stone', ['guardian', 4], ['stoneShard', 4, 2], ['stoneCaller', 3]),
  'stone-siege': encounter('late', 'stone-siege', 'stone', ['elemental', 4, 2], ['stoneShard', 4], ['stoneCaller', 3]),
  'goblin-duo': encounter('early', 'goblin-duo', 'goblins', ['scout', 2], ['warlock', 1]),
  'goblin-trio': encounter('early', 'goblin-trio', 'goblins', ['scout', 2], ['archer', 2], ['warlock', 1]),
  'goblin-hex-patrol': encounter('mid', 'goblin-hex-patrol', 'goblins', ['scout', 3], ['warlock', 2]),
  'goblin-slingers': encounter('mid', 'goblin-slingers', 'goblins', ['archer', 3, 2], ['scout', 3]),
  'royal-escort': encounter('late', 'royal-escort', 'goblins', ['goblinGuard', 4], ['warlock', 4]),
  'goblin-slinging-trio': encounter('late', 'goblin-slinging-trio', 'goblins', ['archer', 4, 2], ['bomber', 4]),
  'bandit-duo': encounter('early', 'bandit-duo', 'bandits', ['banditRaider', 2], ['banditArcher', 2]),
  'bandit-trio': encounter('early', 'bandit-trio', 'bandits', ['banditRaider', 2], ['banditArcher', 2], ['banditMedic', 1]),
  'bandit-pursuit': encounter('mid', 'bandit-pursuit', 'bandits', ['banditRaider', 3, 2]),
  'bandit-firing-trio': encounter('mid', 'bandit-firing-trio', 'bandits', ['banditArcher', 3, 2], ['banditRaider', 3]),
  'bandit-elite-duo': encounter('late', 'bandit-elite-duo', 'bandits', ['banditGuard', 4], ['banditMedic', 4]),
  'bandit-trio-veterans': encounter('late', 'bandit-trio-veterans', 'bandits', ['banditRaider', 5], ['banditArcher', 5], ['banditMedic', 4]),
  'orc-pair': encounter('early', 'orc-pair', 'orcs', ['orc', 2], ['orcArcher', 2]),
  'orc-scouting-party': encounter('early', 'orc-scouting-party', 'orcs', ['orc', 2], ['orcArcher', 2], ['shaman', 1]),
  'orc-warriors': encounter('mid', 'orc-warriors', 'orcs', ['orc', 3, 2]),
  'orc-trio': encounter('mid', 'orc-trio', 'orcs', ['orc', 3], ['orcArcher', 3, 2]),
  'orc-raiding-pair': encounter('late', 'orc-raiding-pair', 'orcs', ['orcKing', 4], ['shaman', 4]),
  'orc-raiding-party': encounter('late', 'orc-raiding-party', 'orcs', ['orc', 4], ['orcArcher', 4], ['shaman', 4]),
  'bone-pair': encounter('early', 'bone-pair', 'skeletons', ['skeleton', 2], ['skeletonArcher', 2]),
  'bone-archers': encounter('early', 'bone-archers', 'skeletons', ['skeletonArcher', 2, 2]),
  'bone-trio': encounter('early', 'bone-trio', 'skeletons', ['skeleton', 2, 2], ['skeletonArcher', 2]),
  'bone-vanguard': encounter('mid', 'bone-vanguard', 'skeletons', ['deathKnight', 3], ['skeletonArcher', 3]),
  'bone-line-trio': encounter('mid', 'bone-line-trio', 'skeletons', ['skeleton', 3], ['skeletonArcher', 3, 2]),
  'bone-royal-pair': encounter('late', 'bone-royal-pair', 'skeletons', ['skeletonKing', 4], ['deathKnight', 4]),
  'bone-trio-late': encounter('late', 'bone-trio-late', 'skeletons', ['skeletonKing', 4], ['skeletonArcher', 4, 2]),
  'kobold-pair': encounter('early', 'kobold-pair', 'kobolds', ['koboldMiner', 2], ['koboldTrapper', 2]),
  'kobold-trap-setting': encounter('early', 'kobold-trap-setting', 'kobolds', ['koboldTrapper', 2, 2]),
  'kobold-mining-party': encounter('early', 'kobold-mining-party', 'kobolds', ['koboldMiner', 2], ['koboldTrapper', 2], ['koboldWarlock', 1]),
  'kobold-scout-pair': encounter('mid', 'kobold-scout-pair', 'kobolds', ['koboldMiner', 3], ['koboldWarlock', 2]),
  'kobold-trio': encounter('mid', 'kobold-trio', 'kobolds', ['koboldTrapper', 3, 2], ['koboldMiner', 3]),
  'kobold-warlock-trio': encounter('late', 'kobold-warlock-trio', 'kobolds', ['koboldWarlock', 4, 3]),
  'kobold-mining-trio': encounter('late', 'kobold-mining-trio', 'kobolds', ['koboldMiner', 4, 3]),
  'wolf-pair': encounter('early', 'wolf-pair', 'beasts', ['wolf', 2, 2], ['bear', 2]),
  'bear-and-pack': encounter('early', 'bear-and-pack', 'beasts', ['bear', 2], ['wolf', 2], ['packLeader', 1]),
  'alpha-pair': encounter('mid', 'alpha-pair', 'beasts', ['wolf', 3], ['packLeader', 2]),
  'wolves-and-bears': encounter('mid', 'wolves-and-bears', 'beasts', ['wolf', 3, 2], ['bear', 3]),
  'triple-bears': encounter('late', 'triple-bears', 'beasts', ['bear', 4, 3]),
  'alpha-and-wolf': encounter('late', 'alpha-and-wolf', 'beasts', ['packLeader', 4], ['wolf', 4]),
  'stone-shard-pair': encounter('early', 'stone-shard-pair', 'stone', ['stoneShard', 2, 2]),
  'stone-trio': encounter('early', 'stone-trio', 'stone', ['elemental', 2], ['stoneShard', 2, 2]),
  'triple-golems': encounter('mid', 'triple-golems', 'stone', ['guardian', 3, 3]),
  'stone-caller-pair': encounter('late', 'stone-caller-pair', 'stone', ['guardian', 3], ['stoneCaller', 2]),
  'triple-golems-late': encounter('late', 'triple-golems-late', 'stone', ['guardian', 4, 3]),
  'summit-dragon': encounter('boss', 'summit-dragon', 'dragons', ['dragon', 5]),
  'dragon-mother-arrives': encounter('early', 'dragon-mother-arrives', 'dragons', ['dragon', 5]),
  'crystal-bats': encounter('early', 'crystal-bats', 'crystals', ['crystalBat', 2, 2], ['smokySpider', 2]),
  'quarry-scouts': encounter('early', 'quarry-scouts', 'crystals', ['crystalKobold', 2, 2], ['quartzCrossbowman', 2]),
  'geode-ambush': encounter('early', 'geode-ambush', 'crystals', ['smokySpider', 2, 2], ['spectralMiner', 2]),
  'prism-patrol': encounter('early', 'prism-patrol', 'crystals', ['quartzCrossbowman', 3, 2], ['crystalSorceress', 3], ['crystalKobold', 3]),
  'troll-vanguard': encounter('early', 'troll-vanguard', 'crystals', ['caveTroll', 3], ['crystalKobold', 3, 2], ['quartzCrossbowman', 3]),
  'golem-quarry': encounter('early', 'golem-quarry', 'crystals', ['fluoriteGolem', 3], ['crystalKobold', 3], ['spectralMiner', 3, 2]),
  'salamander-den': encounter('early', 'salamander-den', 'crystals', ['obsidianSalamander', 3, 2], ['smokySpider', 3], ['crystalBat', 3]),
  'sorceress-coven': encounter('early', 'sorceress-coven', 'crystals', ['crystalSorceress', 4, 2], ['spectralMiner', 4], ['crystalBat', 4, 2]),
  'drake-nest': encounter('early', 'drake-nest', 'crystals', ['crystalDrake', 4], ['crystalSorceress', 4], ['quartzCrossbowman', 4, 2]),
  'deep-crystal-court': encounter('early', 'deep-crystal-court', 'crystals', ['caveTroll', 5], ['fluoriteGolem', 5], ['crystalSorceress', 5], ['crystalDrake', 5])
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
    beasts: { early: ['hill-pack', 'valley-hunt', 'wolf-pair', 'bear-and-pack', 'mountain-scarabs'], mid: ['wolf-pack', 'bear-den', 'alpha-pair', 'wolves-and-bears'], late: ['high-pack', 'bear-hunters', 'triple-bears', 'alpha-and-wolf'] },
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
    haunting: { chance: 0.05, eventId: 'spectral-pass', depth: 3 },
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
