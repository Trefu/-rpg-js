import type { DefensePatternConfig } from '../defense/types'
import type { IAbility, AbilityContext } from '../interfaces/IAbility'
import { fixedPhase, phase } from '../defense/attackPatterns'
import { registerAbility, registerEnemyAttack } from './registry'
import {
  damageStep,
  previewFromPipeline,
  type DamageStep
} from './damagePipeline'
import { StatusEffects } from '../StatusEffects'
import dragonRoarIcon from '@/assets/icons/dragon-head.png'
import curseIcon from '@/assets/icons/cursed-star.png'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const SLASH: DefensePatternConfig = {
    name: 'Espadazo',
    type: 'physical',
    damageType: 'physical',
    baseMaxBlockReduction: 0.5,
    damageMultiplier: 2,
    phases: [fixedPhase(1, 2, 3, 4, 5, 6), fixedPhase(1, 2, 3, 4, 5, 6)]
}
registerEnemyAttack(SLASH)

export const POISON_ARROW: DefensePatternConfig = {
    name: 'Flecha Venenosa',
    type: 'physical',
    damageType: 'physical',
    waveSpeed: 50,
    baseMaxBlockReduction: 0.5,
    baseSuccessZoneSize: 0.2,
    damageMultiplier: 0.6,
    phases: [phase(20), phase(10)],
    onFailureEffect: {
        statusType: 'poison',
        stacks: 8
    }
}
registerEnemyAttack(POISON_ARROW)

export const TRIPLE_ARROW: DefensePatternConfig = {
    name: 'Trío de Flechas',
    type: 'physical',
    damageType: 'physical',
    waveSpeed: 70,
    baseMaxBlockReduction: 0.5,
    damageMultiplier: 0.7,
    phases: [fixedPhase(22, 23, 24, 25, 26, 27), fixedPhase(22, 23, 24, 25, 26, 27), fixedPhase(28, 22, 23, 24, 25, 26, 27)],
    onFailureEffect: {
        statusType: 'poison',
        stacks: 8
    }
}
registerEnemyAttack(POISON_ARROW)

export const EMBER: DefensePatternConfig = {
    name: 'Ascua',
    type: 'fire',
    damageType: 'fire',
    waveSpeed: 50,
    baseMaxBlockReduction: 0.5,
    damageMultiplier: 0.7,
    phases: [phase(8), phase(8)],
    onFailureEffect: {
        statusType: 'burn',
        stacks: 8
    }
}
registerEnemyAttack(EMBER)

export const FEROCIOUS_BITE: DefensePatternConfig = {
    name: 'Mordida Feroz',
    type: 'physical',
    damageType: 'physical',
    baseMaxBlockReduction: 0.5,
    damageMultiplier: 0.8,
    phases: [
        phase(6, { waveSpeed: 30 }),
        phase(6, { waveSpeed: 40 }),
        phase(6, { waveSpeed: 50 })
    ]
}
registerEnemyAttack(FEROCIOUS_BITE)

export const QUICK_CLAWS: DefensePatternConfig = {
    name: 'Zarpazos Rápidos',
    type: 'physical',
    damageType: 'physical',
    waveSpeed: 40,
    baseMaxBlockReduction: 0.5,
    damageMultiplier: 0.5,
    phases: [fixedPhase(1, 2, 3, 4), fixedPhase(1, 2, 3, 4, 5), fixedPhase(4, 5, 6, 7, 8)]
}
registerEnemyAttack(QUICK_CLAWS)

export const MULTIPLE_AXE_STRIKES: DefensePatternConfig = {
    name: 'Hachazos Múltiples',
    type: 'physical',
    damageType: 'physical',
    waveSpeed: 35,
    baseMaxBlockReduction: 0.5,
    damageMultiplier: 0.8,
    phases: [phase(3), phase(3), phase(3), phase(3), phase(5)]
}
registerEnemyAttack(MULTIPLE_AXE_STRIKES)

export const CRUSHING_BLOW: DefensePatternConfig = {
    name: 'Golpe Aplastante',
    type: 'physical',
    damageType: 'physical',
    baseMaxBlockReduction: 0.5,
    damageMultiplier: 1.5,
    phases: [phase(5), phase(5)]
}
registerEnemyAttack(CRUSHING_BLOW)

export const GENTLE_STRIKE: DefensePatternConfig = {
    name: 'Golpe Suave',
    type: 'physical',
    damageType: 'physical',
    waveSpeed: 25,
    baseMaxBlockReduction: 0.8,
    damageMultiplier: 1.0,
    phases: [phase(5)]
}
registerEnemyAttack(GENTLE_STRIKE)

export const QUICK_STRIKE: DefensePatternConfig = {
    name: 'Golpe Rápido',
    type: 'physical',
    damageType: 'physical',
    waveSpeed: 65,
    baseMaxBlockReduction: 0.5,
    damageMultiplier: 0.5,
    phases: [phase(2),phase(2), phase(2), phase(2)]
}
registerEnemyAttack(QUICK_STRIKE)

export const DOUBLE_COMBO: DefensePatternConfig = {
    name: 'Combo Doble',
    type: 'physical',
    damageType: 'physical',
    waveSpeed: 35,
    baseMaxBlockReduction: 0.5,
    damageMultiplier: 1.2,
    phases: [phase(4), phase(4)]
}
registerEnemyAttack(DOUBLE_COMBO)

export const TRIPLE_COMBO: DefensePatternConfig = {
    name: 'Combo Triple',
    type: 'physical',
    damageType: 'physical',
    waveSpeed: 70,
    baseMaxBlockReduction: 0.4,
    damageMultiplier: 1.4,
    phases: [phase(4), phase(4), phase(4)]
}
registerEnemyAttack(TRIPLE_COMBO)

export const FIRE_BREATH: DefensePatternConfig = {
    name: 'Aliento de Fuego',
    type: 'fire',
    damageType: 'fire',
    baseMaxBlockReduction: 0.5,
    damageMultiplier: 2.0,
    phases: [
        phase(7, { waveSpeed: 60 }),
        phase(7, { waveSpeed: 60 }),
        phase(7, { waveSpeed: 60 }),
        phase(7, { waveSpeed: 60 }),
        phase(7, { waveSpeed: 60 })
    ],
    onFailureEffect: {
        statusType: 'burn',
        stacks: 20
    }
}
registerEnemyAttack(FIRE_BREATH)

export const GLACIAL_BREATH: DefensePatternConfig = {
    name: 'Aliento Glacial',
    type: 'water',
    damageType: 'water',
    waveSpeed: 50,
    baseMaxBlockReduction: 0.5,
    damageMultiplier: 0.7,
    phases: [phase(3)],
    onFailureEffect: {
        statusType: 'freeze',
        stacks: 1
    }
}
registerEnemyAttack(GLACIAL_BREATH)

export const DEEP_SLASH: DefensePatternConfig = {
    name: 'Tajo Profundo',
    type: 'physical',
    damageType: 'physical',
    waveSpeed: 50,
    baseMaxBlockReduction: 0.5,
    damageMultiplier: 1.5,
    phases: [phase(4)],
    onFailureEffect: {
        statusType: 'injured',
        stacks: 1,
        maxDuration: 3
    }
}
registerEnemyAttack(DEEP_SLASH)

export const GUST_OF_FOG: DefensePatternConfig = {
    name: 'Ráfaga de Niebla',
    type: 'arcane',
    damageType: 'arcane',
    waveSpeed: 45,
    baseMaxBlockReduction: 0.4,
    damageMultiplier: 1.1,
    phases: [phase(3)],
    onFailureEffect: {
        statusType: 'clouded',
        stacks: 2,
        maxDuration: 2
    }
}
registerEnemyAttack(GUST_OF_FOG)

export const ENTANGLE: DefensePatternConfig = {
    name: 'Ataque Enredador',
    type: 'physical',
    damageType: 'physical',
    waveSpeed: 40,
    baseMaxBlockReduction: 0.5,
    damageMultiplier: 0.9,
    phases: [phase(4), phase(4)],
    onFailureEffect: {
        statusType: 'rooted',
        stacks: 1
    }
}
registerEnemyAttack(ENTANGLE)

export const FLASH: DefensePatternConfig = {
    name: 'Destello',
    type: 'arcane',
    damageType: 'arcane',
    waveSpeed: 50,
    baseMaxBlockReduction: 0.4,
    damageMultiplier: 0.8,
    phases: [phase(9)],
    onFailureEffect: {
        statusType: 'blinded',
        stacks: 1,
        maxDuration: 2
    }
}
registerEnemyAttack(FLASH)

/**
 * Rugido del Dragon — patron de ataque con defense challenge contra un
 * target primario (elegido por aggro) + splash al resto de heroes vivos.
 *
 * Antes era una `IAbility` con `aoe: true` que pegaba a TODOS los heroes
 * por el mismo daño, sin defense challenge. Era injusto: el jugador no
 * podia mitigar nada. Ahora el primario puede bloquear/reducir el daño
 * via defense challenge, y los demas heroes reciben el 20% del daño
 * MITIGADO (post-defense) como splash.
 *
 * El daño base equivalente al pipeline anterior
 *   `damageStep({ stat: 'body', coef: 2.0, levelCoef: 5, statLabel: 'CUE' })`
 * se aproxima con un patron de 4 fases con zonas anchas y wave lenta.
 * El `damageMultiplier: 2.0` se conserva como en el original.
 */
export const DragonRoar: DefensePatternConfig = {
  name: 'Rugido del Dragón',
  type: 'physical',
  damageType: 'physical',
  waveSpeed: 40,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 2.0,
  phases: [
    phase(10, { waveSpeed: 35 }),
    phase(10, { waveSpeed: 40 }),
    phase(10, { waveSpeed: 45 }),
    phase(10, { waveSpeed: 50 })
  ],
  mitigatedSplash: { damageMultiplier: 0.2 }
}
registerEnemyAttack(DragonRoar)

// Mantener un preview util para UIs que muestren el dano potencial del
// DragonRoar (ej: la barra de preview de damage del dragon). Usa el
// mismo pipeline que el patron original.
export const DragonRoarPreview: DamageStep = damageStep({
  stat: 'body',
  coef: 2.0,
  levelCoef: 5,
  statLabel: 'CUE'
})
export const DragonRoarPreviewFn = previewFromPipeline(DragonRoarPreview, 'physical')
// Icono exportado para UIs que lo necesiten (no se usa dentro del patron).
export { dragonRoarIcon }

export const WarlockHex: IAbility = {
  name: 'Maldición',
  description: 'El warlock susurra una maldición inevitable sobre el objetivo: acumula oscuridad de Maldición sobre él. No se puede bloquear.',
  type: 'warlockHex',
  cooldown: 0,
  damageType: 'arcane',
  targetType: 'enemies-only',
  tags: ['holy'],
  icon: curseIcon,
  requiresTarget: true,
  animationDurationMs: 1200,
  execute: async (context: AbilityContext) => {
    const target = context.target
    if (!target || typeof target.addStatusEffect !== 'function' || !target.isAlive) {
      await sleep(context.animationDelay)
      return
    }
    const template = StatusEffects.CURSE
    const existing = (target.statusEffects as Array<{ type: string; stacks?: number; maxStacks?: number; turns: number; maxDuration?: number }>)
      .find(e => e.type === 'curse')

    if (existing) {
      const maxStacks = existing.maxStacks ?? template.maxStacks ?? 5
      const currentStacks = existing.stacks ?? 0
      existing.stacks = Math.min(maxStacks, currentStacks + 1)
      // Refresh duración a la base del template para que reaplicar
      // mantenga la ventana de amenaza activa.
      existing.maxDuration = template.turns
      existing.turns = template.turns
    } else {
      target.addStatusEffect({ ...template, stacks: 1 })
    }

    const appliedStacks = (target.statusEffects as Array<{ type: string; stacks?: number }>)
      .find(e => e.type === 'curse')?.stacks ?? 1
    context.log(`¡${target.name} ha sido maldecido (${appliedStacks}/5)!`)
    context.showAnnouncement(`¡Maldición ${appliedStacks}/5!`, 'status', 1500)

    await sleep(context.animationDelay)
  }
}
registerAbility(WarlockHex)
