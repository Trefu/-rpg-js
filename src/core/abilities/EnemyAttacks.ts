import type { DefensePatternConfig } from '../defense/types'
import type { IAbility } from '../interfaces/IAbility'
import { fixedPhase, phase } from '../defense/attackPatterns'
import { registerAbility, registerEnemyAttack } from './registry'
import {
  computeRawDamage,
  dealDamage,
  damageStep,
  previewFromPipeline,
  type DamageStep
} from './damagePipeline'
import dragonRoarIcon from '@/assets/icons/dragon-head.png'

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
    baseMaxBlockReduction: 0.5,
    damageMultiplier: 0.8,
    phases: [phase(3), phase(3), phase(3), phase(3)]
}
registerEnemyAttack(MULTIPLE_AXE_STRIKES)

export const CRUSHING_BLOW: DefensePatternConfig = {
    name: 'Golpe Aplastante',
    type: 'physical',
    damageType: 'physical',
    baseMaxBlockReduction: 0.5,
    damageMultiplier: 1.5,
    phases: [phase(3), phase(3)]
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
    waveSpeed: 55,
    baseMaxBlockReduction: 0.5,
    damageMultiplier: 0.7,
    phases: [phase(2)]
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
    phases: [phase(3), phase(3), phase(3)]
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

/**
 * Rafaga de Niebla: ataque magico de viento que envuelve al jugador en nubes
 * al fallar el bloqueo. Aplica el debufo "Nublado" durante hasta 3 turnos,
 * lo que hace aparecer nubes flotantes sobre la barra de defensa y la vuelve
 * ligeramente mas dificil (onda +15% velocidad, zona de exito -3%).
 *
 * Reusa `applyFailureEffect` con `maxDuration: 3` para que la primera aplicacion
 * ya cargue los 3 turnos (sin default DoT).
 */
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
        stacks: 1,
        maxDuration: 3
    }
}
registerEnemyAttack(GUST_OF_FOG)

/**
 * Rugido del Dragon: ability AOE del Dragon Ancestral. NO usa defense
 * challenge — es un AoE puro que golpea a todos los heroes vivos con
 * el mismo daño final (con crit ya aplicado). Smoke test del sistema
 * enemigo → IAbility unificado (Fase 3 del refactor de abilities).
 *
 * Pipeline `body × 2.0 + level × 5` → daño alto que escala bien con
 * el nivel del dragon. Se castea como IAbility y se registra en el
 * ability registry para que el training panel lo pueda listar si
 * queremos exponerlo.
 */
export const DragonRoar: IAbility = {
  name: 'Rugido del Dragón',
  description: 'Onda sonora devastadora que golpea a TODOS los heroes vivos con daño físico masivo. No se puede bloquear.',
  type: 'dragonRoar',
  cooldown: 0,
  damageType: 'physical',
  targetType: 'enemies-only',
  tags: ['physical', 'damage', 'aoe'],
  icon: dragonRoarIcon,
  requiresTarget: false,
  aoe: true,
  pipeline: damageStep({ stat: 'body', coef: 2.0, levelCoef: 5, statLabel: 'CUE' }),
  previewDamage: previewFromPipeline(
    damageStep({ stat: 'body', coef: 2.0, levelCoef: 5, statLabel: 'CUE' }),
    'physical'
  ),
  execute: async (context) => {
    const caster = context.caster as unknown as Parameters<typeof dealDamage>[0]['caster']
    const target = (context.target ?? caster) as Parameters<typeof dealDamage>[0]['target']
    const pipeline = context.ability.pipeline as DamageStep
    const rawDamage = computeRawDamage(pipeline, caster)
    // El target primario es el caster mismo (la onda se expande desde el dragon);
    // `useCombat.runEnemyAbility` lee `lastPrimaryFinalDamage` y lo replica
    // a TODOS los heroes vivos via `applyEnemyAoe`.
    const { finalDamage } = dealDamage({
      caster,
      target,
      ability: context.ability,
      rawDamage,
      effects: context
    })
    context.lastPrimaryFinalDamage = finalDamage
  }
}
registerAbility(DragonRoar)
