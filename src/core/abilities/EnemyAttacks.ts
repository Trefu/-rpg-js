import type { DefensePatternConfig } from '../defense/types'
import { phase } from '../defense/attackPatterns'

export const GOBLIN_ESPADAZO: DefensePatternConfig = {
  name: 'Espadazo',
  type: 'physical',
  phaseCount: 2,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 2,
  phases: [phase(3), phase(3)]
}

export const GOBLIN_FLECHA_VENENOSA: DefensePatternConfig = {
  name: 'Flecha venenosa',
  type: 'physical',
  phaseCount: 1,
  waveSpeed: 60,
  baseMaxBlockReduction: 0.5,
  baseSuccessZoneSize: 0.2,
  damageMultiplier: 0.6,
  onFailureEffect: {
    statusType: 'poison',
    duration: 3,
    stacks: 1
  }
}

export const GOBLIN_ASCUA: DefensePatternConfig = {
  name: 'Ascua',
  type: 'fire',
  phaseCount: 2,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 0.7,
  phases: [phase(4), phase(5)],
  onFailureEffect: {
    statusType: 'burn',
    duration: 3,
    stacks: 3
  }
}

export const WOLF_MORDIDA_FEROZ: DefensePatternConfig = {
  name: 'Mordida feroz',
  type: 'physical',
  phaseCount: 5,
  waveSpeed: 40,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 0.8,
  phases: [phase(3), phase(3), phase(3), phase(3), phase(3)]
}

export const WOLF_ZARPAZOS_RAPIDOS: DefensePatternConfig = {
  name: 'Zarpazos rápidos',
  type: 'physical',
  phaseCount: 3,
  waveSpeed: 40,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 0.5,
  phases: [phase(3), phase(3), phase(3)]
}

export const ORC_HACHAZOS_MULTIPLES: DefensePatternConfig = {
  name: 'Hachazos múltiples',
  type: 'physical',
  phaseCount: 4,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 0.8,
  phases: [phase(3), phase(3), phase(3), phase(3)]
}

export const ORC_GOLPE_APLASTANTE: DefensePatternConfig = {
  name: 'Golpe aplastante',
  type: 'physical',
  phaseCount: 2,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 1.5,
  phases: [phase(3), phase(3)]
}

export const GOBLIN_ATTACKS: DefensePatternConfig[] = [
  GOBLIN_ESPADAZO,
  GOBLIN_FLECHA_VENENOSA
]

export const GOBLIN_ARCHER_ATTACKS: DefensePatternConfig[] = [
  GOBLIN_FLECHA_VENENOSA
]

export const GOBLIN_WARLOCK_ATTACKS: DefensePatternConfig[] = [
  GOBLIN_ASCUA
]

export const WOLF_ATTACKS: DefensePatternConfig[] = [
  WOLF_MORDIDA_FEROZ,
  WOLF_ZARPAZOS_RAPIDOS
]

export const ORC_ATTACKS: DefensePatternConfig[] = [
  ORC_HACHAZOS_MULTIPLES,
  ORC_GOLPE_APLASTANTE
]

export const ALL_ENEMY_ATTACKS: DefensePatternConfig[] = [
  ...GOBLIN_ATTACKS,
  ...GOBLIN_ARCHER_ATTACKS,
  ...GOBLIN_WARLOCK_ATTACKS,
  ...WOLF_ATTACKS,
  ...ORC_ATTACKS
]
