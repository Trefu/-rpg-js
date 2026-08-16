import type { DefensePatternConfig } from '../defense/types'

export const GOBLIN_MORDIDA: DefensePatternConfig = {
  name: 'Mordida',
  phaseCount: 2,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 2
}

export const GOBLIN_MORDIDA_VENENOSA: DefensePatternConfig = {
  name: 'Mordida venenosa',
  phaseSpeed: 60,
  waveSpeed: 60,
  phaseCount: 1,
  baseMaxBlockReduction: 0.5,
  baseSuccessZoneSize: 0.2,
  damageMultiplier: 0.6,
  onFailureEffect: {
    statusType: 'poison',
    duration: 3,
    stacks: 1
  }
}

export const WOLF_MORDIDA_FEROZ: DefensePatternConfig = {
  name: 'Mordida feroz',
  phaseCount: 5,
  waveSpeed: 40,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 0.8
}

export const WOLF_ZARPAZOS_RAPIDOS: DefensePatternConfig = {
  name: 'Zarpazos rápidos',
  phaseCount: 3,
  waveSpeed: 40,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 0.5
}

export const ORC_HACHAZOS_MULTIPLES: DefensePatternConfig = {
  name: 'Hachazos múltiples',
  phaseCount: 4,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 0.8
}

export const ORC_GOLPE_APLASTANTE: DefensePatternConfig = {
  name: 'Golpe aplastante',
  phaseCount: 2,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 1.5
}

export const GOBLIN_ATTACKS: DefensePatternConfig[] = [
  GOBLIN_MORDIDA,
  GOBLIN_MORDIDA_VENENOSA
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
  ...WOLF_ATTACKS,
  ...ORC_ATTACKS
]
