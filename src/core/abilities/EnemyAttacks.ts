import type { DefensePatternConfig } from '../defense/types'
import { fixedPhase, phase } from '../defense/attackPatterns'

export const ESPADAZO: DefensePatternConfig = {
  name: 'Slash',
  type: 'physical',
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 2,
  phases: [fixedPhase(1,2,3,4,5)]
}

export const FLECHA_VENENOSA: DefensePatternConfig = {
  name: 'Poison Arrow',
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

export const ASCUA: DefensePatternConfig = {
  name: 'Ember',
  type: 'fire',
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 0.7,
  phases: [phase(5)],
  onFailureEffect: {
    statusType: 'burn',
    stacks: 12
  }
}

export const MORDIDA_FEROZ: DefensePatternConfig = {
  name: 'Ferocious Bite',
  type: 'physical',
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 0.8,
  phases: [
    phase(3, { waveSpeed: 30 }),
    phase(3, { waveSpeed: 60 }),
    phase(3, { waveSpeed: 120 })
  ]
}

export const ZARPAZOS_RAPIDOS: DefensePatternConfig = {
  name: 'Quick Claws',
  type: 'physical',
  waveSpeed: 40,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 0.5,
  phases: [phase(3), phase(3), phase(3)]
}

export const HACHAZOS_MULTIPLES: DefensePatternConfig = {
  name: 'Multiple Axe Strikes',
  type: 'physical',
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 0.8,
  phases: [phase(3), phase(3), phase(3), phase(3)]
}

export const GOLPE_APLASTANTE: DefensePatternConfig = {
  name: 'Crushing Blow',
  type: 'physical',
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 1.5,
  phases: [phase(3), phase(3)]
}

export const GOLPE_SUAVE: DefensePatternConfig = {
  name: 'Gentle Strike',
  type: 'physical',
  waveSpeed: 25,
  baseMaxBlockReduction: 0.8,
  damageMultiplier: 1.0,
  phases: [phase(5)]
}

export const GOLPE_RAPIDO: DefensePatternConfig = {
  name: 'Quick Strike',
  type: 'physical',
  waveSpeed: 55,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 0.7,
  phases: [phase(2)]
}

export const COMBO_DOBLE: DefensePatternConfig = {
  name: 'Double Combo',
  type: 'physical',
  waveSpeed: 35,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 1.2,
  phases: [phase(4), phase(4)]
}

export const COMBO_TRIPLE: DefensePatternConfig = {
  name: 'Triple Combo',
  type: 'physical',
  waveSpeed: 45,
  baseMaxBlockReduction: 0.4,
  damageMultiplier: 1.4,
  phases: [phase(3), phase(3), phase(3)]
}

export const ALIENTO_DE_FUEGO: DefensePatternConfig = {
  name: 'Fire Breath',
  type: 'fire',
  waveSpeed: 80,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 2.0,
  phases: Array.from({ length: 10 }, () => phase(6)),
  onFailureEffect: {
    statusType: 'burn',
    stacks: 30
  }
}

export const ALIENTO_GLACIAL: DefensePatternConfig = {
  name: 'Glacial Breath',
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

