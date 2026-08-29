import type { DefensePatternConfig } from '../defense/types'
import { fixedPhase, phase } from '../defense/attackPatterns'

export const GOBLIN_ESPADAZO: DefensePatternConfig = {
  name: 'Espadazo',
  type: 'physical',
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 2,
  phases: [fixedPhase(1,2,3,4,5), fixedPhase(1,2,3,4,5)]
}

export const GOBLIN_FLECHA_VENENOSA: DefensePatternConfig = {
  name: 'Flecha venenosa',
  type: 'physical',
  waveSpeed: 70,
  baseMaxBlockReduction: 0.5,
  baseSuccessZoneSize: 0.2,
  damageMultiplier: 0.6,
  phases: [phase(9)],
  onFailureEffect: {
    statusType: 'poison',
    stacks: 10
  }
}

export const GOBLIN_ASCUA: DefensePatternConfig = {
  name: 'Ascua',
  type: 'fire',
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 0.7,
  phases: [phase(5), phase(5)],
  onFailureEffect: {
    statusType: 'burn',
    stacks: 3
  }
}

export const WOLF_MORDIDA_FEROZ: DefensePatternConfig = {
  name: 'Mordida feroz',
  type: 'physical',
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 0.8,
  phases: [
    phase(3, { waveSpeed: 30 }),
    phase(3, { waveSpeed: 35 }),
    phase(3, { waveSpeed: 40 }),
    phase(3, { waveSpeed: 45 }),
    phase(3, { waveSpeed: 50 })
  ]
}

export const WOLF_ZARPAZOS_RAPIDOS: DefensePatternConfig = {
  name: 'Zarpazos rápidos',
  type: 'physical',
  waveSpeed: 40,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 0.5,
  phases: [phase(3), phase(3), phase(3)]
}

export const ORC_HACHAZOS_MULTIPLES: DefensePatternConfig = {
  name: 'Hachazos múltiples',
  type: 'physical',
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 0.8,
  phases: [phase(3), phase(3), phase(3), phase(3)]
}

export const ORC_GOLPE_APLASTANTE: DefensePatternConfig = {
  name: 'Golpe aplastante',
  type: 'physical',
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 1.5,
  phases: [phase(3), phase(3)]
}

export const GOLPE_SUAVE: DefensePatternConfig = {
  name: 'Golpe Suave',
  type: 'physical',
  waveSpeed: 25,
  baseMaxBlockReduction: 0.8,
  damageMultiplier: 1.0,
  phases: [phase(5)]
}

export const GOLPE_RAPIDO: DefensePatternConfig = {
  name: 'Golpe Rápido',
  type: 'physical',
  waveSpeed: 55,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 0.7,
  phases: [phase(2)]
}

export const COMBO_DOBLE: DefensePatternConfig = {
  name: 'Combo Doble',
  type: 'physical',
  waveSpeed: 35,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 1.2,
  phases: [phase(4), phase(4)]
}

export const COMBO_TRIPLE: DefensePatternConfig = {
  name: 'Combo Triple',
  type: 'physical',
  waveSpeed: 45,
  baseMaxBlockReduction: 0.4,
  damageMultiplier: 1.4,
  phases: [phase(3), phase(3), phase(3)]
}

export const MORDIDA_TOXICA: DefensePatternConfig = {
  ...GOBLIN_FLECHA_VENENOSA,
  name: 'Mordida Tóxica',
  damageMultiplier: 0.6,
  onFailureEffect: {
    statusType: 'poison',
    stacks: 2
  }
}

export const ALIENTO_DE_FUEGO: DefensePatternConfig = {
  name: 'Aliento de Fuego',
  type: 'fire',
  waveSpeed: 80,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 2.0,
  phases: Array.from({ length: 10 }, () => phase(4)),
  onFailureEffect: {
    statusType: 'burn',
    stacks: 1
  }
}

export const ALIENTO_GLACIAL: DefensePatternConfig = {
  name: 'Aliento Glacial',
  type: 'frost',
  waveSpeed: 50,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 0.7,
  phases: [phase(3)],
  onFailureEffect: {
    statusType: 'freeze',
    stacks: 1
  }
}

