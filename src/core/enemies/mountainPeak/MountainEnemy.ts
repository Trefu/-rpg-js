import { Enemy } from '../Enemy'
import type { EnemyAction, ICharacter } from '../../interfaces/ICharacter'
import type { Hero } from '../../Hero'
import type { DefensePatternConfig } from '../../defense/types'
import type { EnemyGroupId } from '../groups'
import { StatusEffects } from '../../StatusEffects'
import {
  AncestralGuard, AttackOrder, MountainMend, StonePreparation, STONE_SMASH,
  MOUNTAIN_STAB, MOUNTAIN_SLASH, MOUNTAIN_JAB, MOUNTAIN_SNARE, MOUNTAIN_ARROW, MOUNTAIN_POISON_ARROW,
  MOUNTAIN_BITE, MOUNTAIN_POUNCE, MOUNTAIN_REND, MOUNTAIN_CLEAVE, MOUNTAIN_OVERHEAD, MOUNTAIN_WHIRL,
  MOUNTAIN_RIPOSTE, MOUNTAIN_EMBER, MOUNTAIN_FROST, MOUNTAIN_SLAM, MOUNTAIN_QUAKE,
  DRAGON_CLAWS, DRAGON_BREATH, DRAGON_TAIL, BOMB_SHRAPNEL, BOMB_FIRE, BOMB_SMOKE, BOMB_CHAIN,
  EARTH_SPIKES, EARTH_BOULDER, BEAR_MAUL, BEAR_CRUSH, MINING_PICK, GRAVEL_SHOWER, SPIKE_TRAP,
  GOBLIN_ROYAL_STRIKE, GOBLIN_SCEPTER, GOBLIN_ROYAL_SWEEP, GOBLIN_ROYAL_COMBO
} from '../../abilities/MountainActions'
import {
  DragonRoar, ENTANGLE, TRIPLE_ARROW, HEAVY_ARROW, QUICK_CLAWS, GUST_OF_FOG, WarlockHex,
  SLASH, DEEP_SLASH, QUICK_STRIKE, DOUBLE_COMBO, POISON_ARROW, FLASH,
  AXE_CLEAVE, AXE_HOOK, MULTIPLE_AXE_STRIKES, CRUSHING_BLOW
} from '../../abilities/EnemyAttacks'
import { GOBLIN_WARLOCK_ATTACKS } from './GoblinWarlock'
import {
  QUARTZ_BOLT, SHARD_BURST, CRYSTAL_LANCE, PRISM_BEAM, CRYSTAL_WEB,
  AMETHYST_MAUL, CAVE_TREMOR, FLUORITE_SLAM, SMOKE_FANGS, OBSIDIAN_LASH,
  MOLTEN_SCATTER, INDIGO_DIVE, ECHO_SCREECH, SPECTRAL_LANTERN, PHANTOM_PICK,
  DRAKE_CRYSTAL_BREATH, DRAKE_CROWN_BEAM
} from '../../abilities/CrystalActions'
import goblinSprite from '@/assets/sprites/enemies/mountain-peak/goblin.png'
import archerSprite from '@/assets/sprites/enemies/mountain-peak/goblin-archer.png'
import wolfSprite from '@/assets/sprites/enemies/mountain-peak/wolf.png'
import shamanSprite from '@/assets/sprites/enemies/mountain-peak/orc-chaman.png'
import guardianSprite from '@/assets/sprites/enemies/mountain-peak/stone-golem.png'
import captainSprite from '@/assets/sprites/enemies/mountain-peak/bandit-captain.png'
import dragonSprite from '@/assets/sprites/enemies/mountain-peak/dragon.png'
import skeletonSprite from '@/assets/sprites/enemies/mountain-peak/skeleton.png'
import skeletonArcherSprite from '@/assets/sprites/enemies/mountain-peak/skeleton-archer.png'
import deathKnightSprite from '@/assets/sprites/enemies/mountain-peak/skeleton-death-knight.png'
import skeletonKingSprite from '@/assets/sprites/enemies/mountain-peak/skeleton-king.png'
import elementalSprite from '@/assets/sprites/enemies/mountain-peak/stone-elemental.png'
import bearSprite from '@/assets/sprites/enemies/mountain-peak/bear.png'
import bomberSprite from '@/assets/sprites/enemies/mountain-peak/goblin-bomber.png'
import warlockSprite from '@/assets/sprites/enemies/mountain-peak/goblin-warlock.png'
import minerSprite from '@/assets/sprites/enemies/mountain-peak/kobold-miner.png'
import trapperSprite from '@/assets/sprites/enemies/mountain-peak/kobold-tramper.png'
import koboldWarlockSprite from '@/assets/sprites/enemies/mountain-peak/kobold-warlock.png'
import orcSprite from '@/assets/sprites/enemies/mountain-peak/orc.png'
import orcArcherSprite from '@/assets/sprites/enemies/mountain-peak/orc-archer.png'
import orcKingSprite from '@/assets/sprites/enemies/mountain-peak/orc-king.png'
import goblinKingSprite from '@/assets/sprites/enemies/mountain-peak/goblin-king.png'
import banditSprite from '@/assets/sprites/enemies/mountain-peak/bandit.png'
import banditArcherSprite from '@/assets/sprites/enemies/mountain-peak/bandit-archer.png'
import banditMedicSprite from '@/assets/sprites/enemies/mountain-peak/bandit-rogue.png'
import packLeaderSprite from '@/assets/sprites/enemies/mountain-peak/alpha-wolf.png'
import goblinRiderSprite from '@/assets/sprites/enemies/mountain-peak/goblin-with-wolf.png'
import troglodyteSprite from '@/assets/sprites/enemies/atlantida/troglodyte.png'
import lostTroglodyteSprite from '@/assets/sprites/enemies/atlantida/lost-troglodyte.png'
import scarabSprite from '@/assets/sprites/enemies/mountain-peak/mountain-scarab.png'
import caveTrollSprite from '@/assets/sprites/enemies/crystal-caverns/cave-troll.png'
import crystalSorceressSprite from '@/assets/sprites/enemies/crystal-caverns/crystal-sorceress.png'
import crystalKoboldSprite from '@/assets/sprites/enemies/crystal-caverns/crystal-kobold.png'
import crystalDrakeSprite from '@/assets/sprites/enemies/crystal-caverns/crystal-drake.png'
import spectralMinerSprite from '@/assets/sprites/enemies/crystal-caverns/spectral-miner.png'
import crystalBatSprite from '@/assets/sprites/enemies/crystal-caverns/crystal-bat.png'
import fluoriteGolemSprite from '@/assets/sprites/enemies/crystal-caverns/fluorite-golem.png'
import obsidianSalamanderSprite from '@/assets/sprites/enemies/crystal-caverns/obsidian-salamander.png'
import quartzCrossbowmanSprite from '@/assets/sprites/enemies/crystal-caverns/quartz-crossbowman.png'
import smokySpiderSprite from '@/assets/sprites/enemies/crystal-caverns/smoky-spider.png'

export type MountainRole = 'scout' | 'archer' | 'wolf' | 'shaman' | 'guardian' | 'captain' | 'dragon'
  | 'skeleton' | 'skeletonArcher' | 'deathKnight' | 'skeletonKing' | 'elemental' | 'bear'
  | 'bomber' | 'warlock' | 'koboldMiner' | 'koboldTrapper' | 'koboldWarlock' | 'orc' | 'orcArcher' | 'orcKing'
  | 'goblinGuard' | 'banditRaider' | 'banditArcher' | 'banditGuard' | 'banditMedic'
  | 'koboldGuard' | 'orcGuard' | 'packLeader' | 'stoneCaller' | 'stoneShard'
  | 'goblinRider' | 'troglodyte' | 'lostTroglodyte' | 'scarab'
  | 'caveTroll' | 'crystalSorceress' | 'crystalKobold' | 'crystalDrake' | 'spectralMiner'
  | 'crystalBat' | 'fluoriteGolem' | 'obsidianSalamander' | 'quartzCrossbowman' | 'smokySpider'
export type MountainCombatRole = 'dps' | 'tank' | 'buffer'
interface RoleSpec {
  name: string
  sprite: string
  hp: number
  growth: number
  body: number
  mind: number
  agility: number
  xp: number
  gold: number
  actions: EnemyAction[]
  /**
   * `true`: la rotación debe empezar en 0 para respetar una apertura
   * telegrafiada (guardián: Coraza → Impacto; capitán/dragón: pacing de
   * jefe). El resto de roles abre en un punto aleatorio de su rotación,
   * para que dos enemigos iguales — o la misma encounter repetida — no
   * lideren siempre con el mismo ataque.
   */
  scripted?: boolean
}
const ROLES: Record<MountainRole, RoleSpec> = {
  goblinRider: { name: 'Jinete goblin', sprite: goblinRiderSprite, hp: 65, growth: 16, body: 26, mind: 12, agility: 15, xp: 30, gold: 18, actions: [MOUNTAIN_JAB, MOUNTAIN_POUNCE, MOUNTAIN_BITE, MOUNTAIN_SNARE] },
  troglodyte: { name: 'Troglodita del paso', sprite: troglodyteSprite, hp: 80, growth: 20, body: 29, mind: 10, agility: 9, xp: 32, gold: 16, actions: [MOUNTAIN_SLAM, BEAR_MAUL, MOUNTAIN_REND, EARTH_BOULDER] },
  lostTroglodyte: { name: 'Troglodita perdido', sprite: lostTroglodyteSprite, hp: 60, growth: 16, body: 25, mind: 14, agility: 12, xp: 28, gold: 14, actions: [MOUNTAIN_STAB, MOUNTAIN_SLASH, MOUNTAIN_SNARE, MOUNTAIN_REND] },
  scarab: { name: 'Escarabajo de montaña', sprite: scarabSprite, hp: 50, growth: 14, body: 24, mind: 12, agility: 13, xp: 25, gold: 12, actions: [MOUNTAIN_BITE, MOUNTAIN_POUNCE, MOUNTAIN_REND, QUICK_CLAWS] },
  // Keep the role ID stable for existing expedition formations and saves.
  goblinGuard: { name: 'Rey Goblin', sprite: goblinKingSprite, hp: 135, growth: 28, body: 32, mind: 20, agility: 11, xp: 50, gold: 28, actions: [AttackOrder, GOBLIN_ROYAL_STRIKE, GOBLIN_SCEPTER, GOBLIN_ROYAL_SWEEP, GOBLIN_ROYAL_COMBO, AncestralGuard], scripted: true },
  banditRaider: { name: 'Saqueador del paso', sprite: banditSprite, hp: 52, growth: 14, body: 25, mind: 12, agility: 12, xp: 26, gold: 16, actions: [SLASH, DEEP_SLASH, QUICK_STRIKE, DOUBLE_COMBO] },
  banditArcher: { name: 'Arquero bandido', sprite: banditArcherSprite, hp: 46, growth: 12, body: 24, mind: 12, agility: 12, xp: 25, gold: 14, actions: [POISON_ARROW, TRIPLE_ARROW, HEAVY_ARROW, ENTANGLE] },
  banditGuard: { name: 'Escudero bandido', sprite: captainSprite, hp: 110, growth: 23, body: 30, mind: 12, agility: 8, xp: 36, gold: 20, actions: [AncestralGuard, SLASH, CRUSHING_BLOW, MOUNTAIN_OVERHEAD, DEEP_SLASH], scripted: true },
  banditMedic: { name: 'Alquimista bandido', sprite: banditMedicSprite, hp: 55, growth: 15, body: 20, mind: 25, agility: 11, xp: 30, gold: 16, actions: [AttackOrder, BOMB_FIRE, BOMB_SMOKE, POISON_ARROW, BOMB_SHRAPNEL, MountainMend], scripted: true },
  koboldGuard: { name: 'Capataz kobold', sprite: minerSprite, hp: 105, growth: 23, body: 29, mind: 14, agility: 8, xp: 36, gold: 21, actions: [AncestralGuard, MINING_PICK, GRAVEL_SHOWER, CRUSHING_BLOW, MOUNTAIN_STAB], scripted: true },
  orcGuard: { name: 'Guardia orco', sprite: orcSprite, hp: 120, growth: 25, body: 32, mind: 12, agility: 8, xp: 40, gold: 21, actions: [AncestralGuard, AXE_CLEAVE, AXE_HOOK, CRUSHING_BLOW, MULTIPLE_AXE_STRIKES], scripted: true },
  packLeader: { name: 'Lobo alfa', sprite: packLeaderSprite, hp: 75, growth: 19, body: 27, mind: 12, agility: 14, xp: 34, gold: 12, actions: [AttackOrder, MOUNTAIN_BITE, MOUNTAIN_POUNCE, MOUNTAIN_REND, QUICK_CLAWS], scripted: true },
  stoneCaller: { name: 'Núcleo de la montaña', sprite: elementalSprite, hp: 80, growth: 20, body: 23, mind: 28, agility: 9, xp: 35, gold: 18, actions: [AncestralGuard, EARTH_SPIKES, EARTH_BOULDER, MOUNTAIN_QUAKE, GRAVEL_SHOWER, MountainMend], scripted: true },
  stoneShard: { name: 'Esquirla viviente', sprite: elementalSprite, hp: 55, growth: 15, body: 25, mind: 20, agility: 12, xp: 27, gold: 13, actions: [EARTH_SPIKES, EARTH_BOULDER, GRAVEL_SHOWER, MOUNTAIN_SLAM] },
  skeleton: { name: 'Esqueleto del risco', sprite: skeletonSprite, hp: 48, growth: 12, body: 23, mind: 10, agility: 11, xp: 23, gold: 12, actions: [SLASH, DEEP_SLASH, QUICK_STRIKE, DOUBLE_COMBO] },
  skeletonArcher: { name: 'Arquero de hueso', sprite: skeletonArcherSprite, hp: 42, growth: 12, body: 24, mind: 12, agility: 12, xp: 25, gold: 13, actions: [MOUNTAIN_ARROW, POISON_ARROW, TRIPLE_ARROW, HEAVY_ARROW] },
  deathKnight: { name: 'Caballero de la muerte', sprite: deathKnightSprite, hp: 115, growth: 24, body: 32, mind: 17, agility: 8, xp: 40, gold: 22, actions: [AncestralGuard, SLASH, DEEP_SLASH, CRUSHING_BLOW, MOUNTAIN_OVERHEAD], scripted: true },
  skeletonKing: { name: 'Rey esqueleto', sprite: skeletonKingSprite, hp: 95, growth: 22, body: 25, mind: 28, agility: 12, xp: 42, gold: 25, actions: [AttackOrder, WarlockHex, MOUNTAIN_FROST, SLASH, GUST_OF_FOG, MountainMend], scripted: true },
  elemental: { name: 'Elemental de tierra', sprite: elementalSprite, hp: 130, growth: 26, body: 32, mind: 20, agility: 7, xp: 42, gold: 20, actions: [StonePreparation, STONE_SMASH, EARTH_SPIKES, EARTH_BOULDER, MOUNTAIN_QUAKE], scripted: true },
  bear: { name: 'Oso de las cumbres', sprite: bearSprite, hp: 110, growth: 22, body: 30, mind: 10, agility: 9, xp: 35, gold: 12, actions: [BEAR_MAUL, BEAR_CRUSH, MOUNTAIN_BITE, MOUNTAIN_REND] },
  bomber: { name: 'Goblin bombardero', sprite: bomberSprite, hp: 40, growth: 12, body: 21, mind: 24, agility: 12, xp: 28, gold: 15, actions: [BOMB_SHRAPNEL, BOMB_FIRE, BOMB_SMOKE, BOMB_CHAIN] },
  warlock: { name: 'Goblin Warlock del paso', sprite: warlockSprite, hp: 55, growth: 15, body: 18, mind: 27, agility: 12, xp: 30, gold: 15, actions: [AncestralGuard, ...GOBLIN_WARLOCK_ATTACKS, AttackOrder], scripted: true },
  koboldMiner: { name: 'Kobold minero', sprite: minerSprite, hp: 58, growth: 14, body: 26, mind: 12, agility: 11, xp: 26, gold: 18, actions: [MINING_PICK, GRAVEL_SHOWER, MOUNTAIN_STAB, EARTH_BOULDER] },
  koboldTrapper: { name: 'Kobold trampero', sprite: trapperSprite, hp: 45, growth: 12, body: 22, mind: 15, agility: 14, xp: 27, gold: 15, actions: [SPIKE_TRAP, MOUNTAIN_SNARE, MOUNTAIN_POISON_ARROW, FLASH] },
  koboldWarlock: { name: 'Kobold hechicero', sprite: koboldWarlockSprite, hp: 58, growth: 15, body: 18, mind: 28, agility: 12, xp: 32, gold: 17, actions: [AttackOrder, MOUNTAIN_EMBER, MOUNTAIN_FROST, WarlockHex, EARTH_SPIKES, MountainMend], scripted: true },
  orc: { name: 'Orco del desfiladero', sprite: orcSprite, hp: 95, growth: 22, body: 30, mind: 12, agility: 9, xp: 35, gold: 20, actions: [MULTIPLE_AXE_STRIKES, CRUSHING_BLOW, AXE_CLEAVE, AXE_HOOK] },
  orcArcher: { name: 'Arquero orco del risco', sprite: orcArcherSprite, hp: 65, growth: 16, body: 27, mind: 13, agility: 11, xp: 30, gold: 18, actions: [POISON_ARROW, TRIPLE_ARROW, HEAVY_ARROW, ENTANGLE] },
  orcKing: { name: 'Rey orco', sprite: orcKingSprite, hp: 180, growth: 35, body: 34, mind: 22, agility: 13, xp: 65, gold: 35, actions: [AttackOrder, AXE_CLEAVE, AXE_HOOK, MULTIPLE_AXE_STRIKES, CRUSHING_BLOW, AncestralGuard], scripted: true },
  scout: { name: 'Explorador goblin', sprite: goblinSprite, hp: 28, growth: 10, body: 20, mind: 10, agility: 9, xp: 17, gold: 15, actions: [MOUNTAIN_STAB, MOUNTAIN_SLASH, MOUNTAIN_JAB, MOUNTAIN_SNARE] },
  archer: { name: 'Arquero del paso', sprite: archerSprite, hp: 35, growth: 11, body: 23, mind: 10, agility: 11, xp: 22, gold: 11, actions: [MOUNTAIN_ARROW, MOUNTAIN_POISON_ARROW, ENTANGLE, TRIPLE_ARROW, HEAVY_ARROW] },
  wolf: { name: 'Lobo de las cumbres', sprite: wolfSprite, hp: 45, growth: 14, body: 24, mind: 10, agility: 13, xp: 24, gold: 8, actions: [MOUNTAIN_BITE, MOUNTAIN_POUNCE, MOUNTAIN_REND, QUICK_CLAWS] },
  shaman: { name: 'Chamán de montaña', sprite: shamanSprite, hp: 50, growth: 15, body: 18, mind: 27, agility: 10, xp: 30, gold: 15, actions: [AncestralGuard, MOUNTAIN_EMBER, MountainMend, MOUNTAIN_FROST, GUST_OF_FOG, WarlockHex] },
  guardian: { name: 'Guardián de piedra', sprite: guardianSprite, hp: 110, growth: 25, body: 34, mind: 12, agility: 8, xp: 40, gold: 22, actions: [StonePreparation, STONE_SMASH, MOUNTAIN_SLAM, MOUNTAIN_QUAKE, MOUNTAIN_STAB], scripted: true },
  captain: { name: 'Capitán del paso', sprite: captainSprite, hp: 300, growth: 60, body: 60, mind: 12, agility: 16, xp: 48, gold: 26, actions: [AttackOrder, MOUNTAIN_CLEAVE, MOUNTAIN_OVERHEAD, MOUNTAIN_WHIRL, MOUNTAIN_RIPOSTE], scripted: true },
  dragon: { name: 'Dragón de la cima', sprite: dragonSprite, hp: 1800, growth: 100, body: 65, mind: 60, agility: 25, xp: 160, gold: 100, actions: [DRAGON_CLAWS, DRAGON_BREATH, DRAGON_TAIL, DragonRoar], scripted: true },
  // Cristalinos de la cueva (assets enemies-nov): patrones rápidos de esquirla.
  crystalBat: { name: 'Murciélago de alas índigo', sprite: crystalBatSprite, hp: 40, growth: 12, body: 22, mind: 12, agility: 16, xp: 24, gold: 10, actions: [INDIGO_DIVE, ECHO_SCREECH, MOUNTAIN_POUNCE, QUICK_CLAWS] },
  smokySpider: { name: 'Araña de cuarzo ahumado', sprite: smokySpiderSprite, hp: 55, growth: 14, body: 25, mind: 14, agility: 13, xp: 27, gold: 14, actions: [SMOKE_FANGS, CRYSTAL_WEB, MOUNTAIN_REND, SPIKE_TRAP] },
  crystalKobold: { name: 'Kobold cristalino', sprite: crystalKoboldSprite, hp: 58, growth: 14, body: 26, mind: 12, agility: 12, xp: 26, gold: 18, actions: [MINING_PICK, QUARTZ_BOLT, GRAVEL_SHOWER, SHARD_BURST] },
  quartzCrossbowman: { name: 'Ballestero de cuarzo', sprite: quartzCrossbowmanSprite, hp: 46, growth: 12, body: 24, mind: 12, agility: 12, xp: 25, gold: 13, actions: [QUARTZ_BOLT, TRIPLE_ARROW, HEAVY_ARROW, SHARD_BURST] },
  spectralMiner: { name: 'Minero espectral', sprite: spectralMinerSprite, hp: 52, growth: 14, body: 22, mind: 22, agility: 12, xp: 30, gold: 16, actions: [PHANTOM_PICK, SPECTRAL_LANTERN, SHARD_BURST, GUST_OF_FOG] },
  obsidianSalamander: { name: 'Salamandra de obsidiana', sprite: obsidianSalamanderSprite, hp: 65, growth: 16, body: 26, mind: 18, agility: 12, xp: 30, gold: 16, actions: [OBSIDIAN_LASH, MOLTEN_SCATTER, MOUNTAIN_EMBER, MOUNTAIN_SLAM] },
  crystalSorceress: { name: 'Hechicera encapuchada', sprite: crystalSorceressSprite, hp: 55, growth: 15, body: 18, mind: 28, agility: 12, xp: 32, gold: 17, actions: [AttackOrder, PRISM_BEAM, CRYSTAL_LANCE, GUST_OF_FOG, WarlockHex, MountainMend], scripted: true },
  caveTroll: { name: 'Trol de amatista', sprite: caveTrollSprite, hp: 125, growth: 26, body: 33, mind: 12, agility: 8, xp: 40, gold: 22, actions: [AncestralGuard, AMETHYST_MAUL, CAVE_TREMOR, MOUNTAIN_SLAM, MOUNTAIN_OVERHEAD], scripted: true },
  fluoriteGolem: { name: 'Gólem de fluorita', sprite: fluoriteGolemSprite, hp: 115, growth: 24, body: 32, mind: 16, agility: 7, xp: 40, gold: 20, actions: [StonePreparation, FLUORITE_SLAM, EARTH_SPIKES, EARTH_BOULDER, CAVE_TREMOR], scripted: true },
  crystalDrake: { name: 'Draco de la corona', sprite: crystalDrakeSprite, hp: 150, growth: 30, body: 30, mind: 24, agility: 12, xp: 55, gold: 30, actions: [DRAKE_CRYSTAL_BREATH, DRAKE_CROWN_BEAM, CRYSTAL_LANCE, DRAGON_TAIL], scripted: true }
} satisfies Record<MountainRole, { name: string; sprite: string; hp: number; growth: number; body: number; mind: number; agility: number; xp: number; gold: number; actions: EnemyAction[]; scripted?: boolean }>

export const CRYSTAL_CAVERN_ROLES: readonly MountainRole[] = ['crystalBat', 'smokySpider', 'crystalKobold', 'quartzCrossbowman', 'spectralMiner',
  'obsidianSalamander', 'crystalSorceress', 'caveTroll', 'fluoriteGolem', 'crystalDrake']
export const ATLANTIDA_ROLES: readonly MountainRole[] = ['troglodyte', 'lostTroglodyte']
const RESERVED_ROLES: readonly MountainRole[] = [...CRYSTAL_CAVERN_ROLES, ...ATLANTIDA_ROLES]

/**
 * Roles accesibles en Montañas Rocosas. Los cristalinos (`CRYSTAL_CAVERN_ROLES`)
 * y los trogloditas (`ATLANTIDA_ROLES`) se excluyen: pertenecen a expediciones
 * futuras y solo se alcanzan mediante sus encuentros propios.
 */
export const MOUNTAIN_ROLES = Object.keys(ROLES)
  .filter(role => !RESERVED_ROLES.includes(role as MountainRole)) as MountainRole[]
const GROUP_ROLES: Record<EnemyGroupId, readonly MountainRole[]> = {
  goblins: ['scout', 'archer', 'bomber', 'warlock', 'goblinGuard', 'goblinRider'],
  bandits: ['captain', 'banditRaider', 'banditArcher', 'banditGuard', 'banditMedic'],
  orcs: ['orc', 'orcArcher', 'shaman', 'orcKing', 'orcGuard'],
  skeletons: ['skeleton', 'skeletonArcher', 'deathKnight', 'skeletonKing'],
  kobolds: ['koboldMiner', 'koboldTrapper', 'koboldWarlock', 'koboldGuard'],
  beasts: ['wolf', 'bear', 'packLeader', 'troglodyte', 'lostTroglodyte', 'scarab'],
  stone: ['guardian', 'elemental', 'stoneCaller', 'stoneShard'],
  crystals: ['crystalBat', 'smokySpider', 'crystalKobold', 'quartzCrossbowman', 'spectralMiner', 'obsidianSalamander', 'crystalSorceress', 'caveTroll', 'fluoriteGolem', 'crystalDrake'],
  dragons: ['dragon']
}

/** Expedition-specific stats keep training and other enemy variants independent. */
export class MountainEnemy extends Enemy {
  // Buffed per-level scaling: a full run was reachable without losses.
  static readonly STAT_GROWTH_PER_LEVEL = 2.0
  static readonly AGILITY_GROWTH_PER_LEVEL = 0.5
  static readonly CONSTITUTION_GROWTH_PER_LEVEL = 0.9
  static readonly HP_GROWTH_PER_LEVEL = 1.3
  readonly sprite: string
  get isBoss(): boolean { return this.role === 'captain' || this.role === 'dragon' }
  get enemyGroup(): EnemyGroupId {
    return (Object.keys(GROUP_ROLES) as EnemyGroupId[]).find(group => GROUP_ROLES[group].includes(this.role))!
  }
  get combatRole(): MountainCombatRole {
    if (['guardian', 'elemental', 'deathKnight', 'bear', 'goblinGuard', 'banditGuard', 'koboldGuard', 'orcGuard', 'caveTroll', 'fluoriteGolem'].includes(this.role)) return 'tank'
    if (['shaman', 'warlock', 'koboldWarlock', 'skeletonKing', 'orcKing', 'banditMedic', 'packLeader', 'stoneCaller', 'crystalSorceress', 'spectralMiner'].includes(this.role)) return 'buffer'
    return 'dps'
  }
  private actionIndex = 0
  private cycleSteps = 0
  constructor(public readonly role: MountainRole, level = 1) {
    const spec = ROLES[role]
    super({
      id: `mountain-${role}-${Math.random().toString(36).slice(2, 10)}`, name: spec.name, level,
      maxHealth: Math.round((spec.hp + (level - 1) * spec.growth * MountainEnemy.HP_GROWTH_PER_LEVEL) * (role === 'captain' || role === 'dragon' ? 1 : 3)),
      experienceReward: Math.floor((spec.xp + (level - 1) * 3) * (role === 'scout' || role === 'archer' || role === 'dragon' ? 1 : 0.65)),
      goldReward: { min: spec.gold, max: spec.gold + 4 }, critChance: role === 'dragon' ? 3 : 0,
      baseStats: {
        body: { value: spec.body, growthPerLevel: MountainEnemy.STAT_GROWTH_PER_LEVEL },
        mind: { value: spec.mind, growthPerLevel: MountainEnemy.STAT_GROWTH_PER_LEVEL },
        agility: { value: spec.agility, growthPerLevel: MountainEnemy.AGILITY_GROWTH_PER_LEVEL },
        constitution: { value: 10, growthPerLevel: MountainEnemy.CONSTITUTION_GROWTH_PER_LEVEL }
      }, enrageThreshold: role === 'dragon' ? 30 : null
    })
    this.sprite = spec.sprite
    this.attackPatterns = [...spec.actions]
    this.actionIndex = spec.scripted ? 0 : Math.floor(Math.random() * this.attackPatterns.length)
  }

  override selectAttackPattern(_player: ICharacter | null): EnemyAction {
    const pattern = this.attackPatterns[this.actionIndex]
    this.actionIndex = (this.actionIndex + 1) % this.attackPatterns.length
    // Al completar un ciclo desde la apertura aleatoria, la rotación se
    // realinea al orden canonico para que el siguiente ciclo sea predecible.
    if (++this.cycleSteps >= this.attackPatterns.length) {
      this.cycleSteps = 0
      this.actionIndex = 0
    }
    return pattern
  }

  get intention(): string { return this.attackPatterns[this.actionIndex % this.attackPatterns.length].name ?? 'Atacar' }

  override attack(): number { return super.attack() * (this.isBoss ? 1 : 2) }

  override calculatePhaseDamage(pattern: DefensePatternConfig, multiplier = 1): number {
    return super.calculatePhaseDamage(pattern, multiplier) * (this.isBoss ? 1 : 2)
  }

  afterAction(): void {
    if (['guardian', 'elemental'].includes(this.role) && this.actionIndex === 2) {
      this.removeStatusEffect('stone_shell')
      this.addStatusEffect({ ...StatusEffects.VULNERABLE, turns: 2 })
    }
  }

  protected override scoreTarget(hero: Hero): number {
    return super.scoreTarget(hero, {
      hpLow: this.role === 'wolf' ? 0.8 : 0.35,
      friendlyDebuffs: this.role === 'wolf' ? 0.15 : 0.05,
      lowDefense: this.role === 'archer' ? 0.6 : 0.1,
      threatModifier: 1
    })
  }
}
