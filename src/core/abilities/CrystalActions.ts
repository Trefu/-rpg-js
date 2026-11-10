import type { DefensePatternConfig } from '../defense/types'
import { phase } from '../defense/attackPatterns'
import { registerEnemyAttack } from './registry'

/**
 * Ataques de la facción "Cristalinos de la cueva" (assets enemies-nov).
 *
 * Todos comparten una firma de patrones RÁPIDOS: waveSpeed alta (36-48) y
 * fases breves, para que los cristalinos pegen más seguido pero con zonas
 * estrechas que premian el bloqueo preciso. Los tanques de la facción
 * (trol, gólem) conservan patrones más lentos y pesados heredados del
 * estilo "guardián pétreo".
 */
const attack = (name: string, multiplier: number, phases: number[], speed = 30,
  extra: Partial<DefensePatternConfig> = {}): DefensePatternConfig => {
  const config: DefensePatternConfig = {
    name, type: 'physical', damageType: 'physical', damageMultiplier: multiplier,
    baseMaxBlockReduction: 0.65, waveSpeed: speed,
    phases: phases.map(columns => phase(columns)), ...extra
  }
  registerEnemyAttack(config)
  return config
}

// Rápidos genéricos de cristal
export const QUARTZ_BOLT = attack('Virote de cuarzo', 1.05, [8, 9], 42)
export const SHARD_BURST = attack('Ráfaga de esquirlas', 0.7, [8, 8, 8], 44, {
  type: 'arcane', damageType: 'arcane'
})
export const CRYSTAL_LANCE = attack('Lanza de cristal', 1.45, [9], 38, {
  type: 'water', damageType: 'water', onFailureEffect: { statusType: 'freeze', stacks: 1 }
})
export const PRISM_BEAM = attack('Rayo prismático', 1.1, [8, 9], 40, {
  type: 'arcane', damageType: 'arcane', mitigatedSplash: { damageMultiplier: 0.15 }
})
export const CRYSTAL_WEB = attack('Telaraña de cristal', 0.75, [9], 36, {
  onFailureEffect: { statusType: 'rooted', stacks: 1, maxDuration: 1 }
})

// Tanques de la cueva (pesados, apertura telegrafiada)
export const AMETHYST_MAUL = attack('Mazo de amatista', 1.7, [10, 10], 30, {
  onFailureEffect: { statusType: 'injured', maxDuration: 1 }
})
export const CAVE_TREMOR = attack('Temblor de la cueva', 1.15, [9, 9], 28, {
  mitigatedSplash: { damageMultiplier: 0.2 }
})
export const FLUORITE_SLAM = attack('Aplastón de fluorita', 1.5, [10], 26, {
  onFailureEffect: { statusType: 'rooted', stacks: 1, maxDuration: 1 }
})

// Bestias cristalinas
export const SMOKE_FANGS = attack('Colmillos ahumados', 0.9, [7, 9], 40, {
  onFailureEffect: { statusType: 'bleed', stacks: 2 }
})
export const OBSIDIAN_LASH = attack('Látigo de obsidiana', 1.1, [9], 40, {
  type: 'fire', damageType: 'fire', onFailureEffect: { statusType: 'burn', stacks: 3 }
})
export const MOLTEN_SCATTER = attack('Salpicadura fundida', 0.85, [8, 9], 42, {
  type: 'fire', damageType: 'fire', onFailureEffect: { statusType: 'burn', stacks: 2 },
  mitigatedSplash: { damageMultiplier: 0.15 }
})
export const INDIGO_DIVE = attack('Picado índigo', 1.15, [8], 46)
export const ECHO_SCREECH = attack('Chillido de eco', 0.8, [10], 40, {
  type: 'arcane', damageType: 'arcane', onFailureEffect: { statusType: 'blinded', maxDuration: 1 }
})

// Espectrales
export const SPECTRAL_LANTERN = attack('Farol espectral', 1.0, [9], 38, {
  type: 'arcane', damageType: 'arcane', onFailureEffect: { statusType: 'slow', maxDuration: 1 }
})
export const PHANTOM_PICK = attack('Pico fantasma', 1.0, [8, 8], 42, {
  onFailureEffect: { statusType: 'injured', maxDuration: 1 }
})

// Draco de cristal (élite de facción)
export const DRAKE_CRYSTAL_BREATH = attack('Aliento prismático', 1.15, [9, 8, 9], 38, {
  type: 'water', damageType: 'water', onFailureEffect: { statusType: 'freeze', stacks: 2 },
  mitigatedSplash: { damageMultiplier: 0.2 }
})
export const DRAKE_CROWN_BEAM = attack('Haz de la corona', 1.3, [8, 9], 36, {
  type: 'holy', damageType: 'holy', mitigatedSplash: { damageMultiplier: 0.15 }
})
