import type { DefensePatternConfig } from '../defense/types'
import { fixedPhase, phase } from '../defense/attackPatterns'

export const SLASH: DefensePatternConfig = {
  name: 'Espadazo',
  type: 'physical',
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 2,
  phases: [fixedPhase(1,2,3,4,5,6)]
}

export const POISON_ARROW: DefensePatternConfig = {
  name: 'Flecha Venenosa',
  type: 'physical',
  waveSpeed: 70,
  baseMaxBlockReduction: 0.5,
  baseSuccessZoneSize: 0.2,
  damageMultiplier: 0.6,
  phases: [phase(10)],
  onFailureEffect: {
    statusType: 'poison',
    stacks: 10
  }
}

export const EMBER: DefensePatternConfig = {
  name: 'Ascua',
  type: 'fire',
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 0.7,
  phases: [phase(6)],
  onFailureEffect: {
    statusType: 'burn',
    stacks: 12
  }
}

export const FEROCIOUS_BITE: DefensePatternConfig = {
  name: 'Mordida Feroz',
  type: 'physical',
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 0.8,
  phases: [
    phase(4, { waveSpeed: 30 }),
    phase(4, { waveSpeed: 60 }),
    phase(4, { waveSpeed: 120 })
  ]
}

export const QUICK_CLAWS: DefensePatternConfig = {
  name: 'Zarpazos Rápidos',
  type: 'physical',
  waveSpeed: 40,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 0.5,
  phases: [phase(3), phase(3), phase(3)]
}

export const MULTIPLE_AXE_STRIKES: DefensePatternConfig = {
  name: 'Hachazos Múltiples',
  type: 'physical',
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 0.8,
  phases: [phase(3), phase(3), phase(3), phase(3)]
}

export const CRUSHING_BLOW: DefensePatternConfig = {
  name: 'Golpe Aplastante',
  type: 'physical',
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 1.5,
  phases: [phase(3), phase(3)]
}

export const GENTLE_STRIKE: DefensePatternConfig = {
  name: 'Golpe Suave',
  type: 'physical',
  waveSpeed: 25,
  baseMaxBlockReduction: 0.8,
  damageMultiplier: 1.0,
  phases: [phase(5)]
}

export const QUICK_STRIKE: DefensePatternConfig = {
  name: 'Golpe Rápido',
  type: 'physical',
  waveSpeed: 55,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 0.7,
  phases: [phase(2)]
}

export const DOUBLE_COMBO: DefensePatternConfig = {
  name: 'Combo Doble',
  type: 'physical',
  waveSpeed: 35,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 1.2,
  phases: [phase(4), phase(4)]
}

export const TRIPLE_COMBO: DefensePatternConfig = {
  name: 'Combo Triple',
  type: 'physical',
  waveSpeed: 45,
  baseMaxBlockReduction: 0.4,
  damageMultiplier: 1.4,
  phases: [phase(3), phase(3), phase(3)]
}

export const FIRE_BREATH: DefensePatternConfig = {
  name: 'Aliento de Fuego',
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

export const GLACIAL_BREATH: DefensePatternConfig = {
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

/**
 * Tajo profundo: corte físico que deja una herida abierta. Si el jugador
 * falla el bloqueo, queda "Lesionado" durante 1 turno completo → la onda
 * del proximo ataque del enemigo se acelera (mas dificil bloquear).
 *
 * `maxDuration: 1` evita que `applyFailureEffect` use el default DoT (3 turnos).
 */
export const DEEP_SLASH: DefensePatternConfig = {
  name: 'Tajo Profundo',
  type: 'physical',
  waveSpeed: 60,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 1.5,
  phases: [phase(4)],
  onFailureEffect: {
    statusType: 'injured',
    stacks: 1,
    maxDuration: 3
  }
}
