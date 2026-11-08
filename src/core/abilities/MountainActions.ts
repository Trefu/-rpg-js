import type { DefensePatternConfig } from '../defense/types'
import type { IAbility } from '../interfaces/IAbility'
import { phase } from '../defense/attackPatterns'
import { StatusEffects } from '../StatusEffects'
import { registerAbility, registerEnemyAttack } from './registry'
import shieldIcon from '@/assets/icons/shield.png'
import heartIcon from '@/assets/icons/heart-drop.png'
import swordIcon from '@/assets/icons/sword-slice.png'

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

export const MOUNTAIN_STAB = attack('Estocada oxidada', 1.2, [10], 26)
export const MOUNTAIN_SLASH = attack('Tajo veloz', 1.0, [8, 8], 34)
export const MOUNTAIN_JAB = attack('Jabalina corta', 0.9, [8, 8, 8], 32)
export const MOUNTAIN_SNARE = attack('Red de caza', 0.8, [9], 30, {
  onFailureEffect: { statusType: 'rooted', stacks: 1, maxDuration: 1 }
})
export const MOUNTAIN_ARROW = attack('Disparo preparado', 1.15, [8, 9], 32)
export const MOUNTAIN_POISON_ARROW = attack('Flecha de cicuta', 1.0, [10], 32, {
  onFailureEffect: { statusType: 'poison', stacks: 2 }
})
export const MOUNTAIN_EMBER = attack('Brasa de montaña', 1.1, [9], 30, {
  type: 'fire', damageType: 'fire', onFailureEffect: { statusType: 'burn', stacks: 3 }
})
export const MOUNTAIN_FROST = attack('Escarcha punzante', 1.0, [8, 9], 30, {
  type: 'water', damageType: 'water', onFailureEffect: { statusType: 'freeze', stacks: 1 }
})
export const MOUNTAIN_BITE = attack('Colmillos desgarradores', 0.95, [8, 9], 34, {
  onFailureEffect: { statusType: 'open_wound', maxDuration: 2 }
})
export const MOUNTAIN_POUNCE = attack('Embestida de lobo', 1.2, [8], 36, {
  onFailureEffect: { statusType: 'slow', maxDuration: 1 }
})
export const MOUNTAIN_REND = attack('Zarpazo sanguinolento', 0.9, [7, 9], 34, {
  onFailureEffect: { statusType: 'bleed', stacks: 2 }
})
export const MOUNTAIN_CLEAVE = attack('Tajo del capitán', 1.15, [8, 8], 34)
export const MOUNTAIN_OVERHEAD = attack('Tajo de guerra', 1.6, [9, 9], 30)
export const MOUNTAIN_WHIRL = attack('Giro del capitán', 1.05, [8, 8, 8], 32, {
  mitigatedSplash: { damageMultiplier: 0.15 }
})
export const MOUNTAIN_RIPOSTE = attack('Contraataque del capitán', 1.15, [9], 40)
export const STONE_SMASH = attack('Impacto de la roca — ¡bloquea!', 2.2, [10, 10], 28)
export const MOUNTAIN_SLAM = attack('Aplastar', 1.6, [10], 24, {
  onFailureEffect: { statusType: 'injured', maxDuration: 1 }
})
export const MOUNTAIN_QUAKE = attack('Temblor de roca', 1.2, [9, 9], 26, {
  mitigatedSplash: { damageMultiplier: 0.15 }
})
export const DRAGON_CLAWS = attack('Garras de la cima', 1.15, [8, 8], 36)
export const DRAGON_BREATH = attack('Aliento incandescente', 1.15, [9, 8, 9], 38, {
  type: 'fire', damageType: 'fire', onFailureEffect: { statusType: 'burn', stacks: 4 },
  mitigatedSplash: { damageMultiplier: 0.2 }
})
export const DRAGON_TAIL = attack('Colazo del dragón', 1.2, [9, 9], 34, {
  mitigatedSplash: { damageMultiplier: 0.25 }
})

export const BOMB_SHRAPNEL = attack('Bomba de metralla', 0.85, [8, 9], 32, {
  onFailureEffect: { statusType: 'bleed', stacks: 2 }, mitigatedSplash: { damageMultiplier: 0.15 }
})
export const BOMB_FIRE = attack('Bomba incendiaria', 1.1, [9], 28, {
  type: 'fire', damageType: 'fire', onFailureEffect: { statusType: 'burn', stacks: 3 }
})
export const BOMB_SMOKE = attack('Carga de humo', 0.7, [10], 30, {
  onFailureEffect: { statusType: 'blinded', maxDuration: 1 }
})
export const BOMB_CHAIN = attack('Mechas encadenadas', 0.65, [8, 9, 8], 36)
export const EARTH_SPIKES = attack('Estacas de tierra', 1.1, [8, 9], 28, {
  onFailureEffect: { statusType: 'rooted', maxDuration: 1 }
})
export const EARTH_BOULDER = attack('Roca rodante', 1.5, [9], 25, {
  mitigatedSplash: { damageMultiplier: 0.2 }
})
export const BEAR_MAUL = attack('Zarpazo del oso', 1.45, [9], 30)
export const BEAR_CRUSH = attack('Abrazo aplastante', 0.9, [9, 8], 26, {
  onFailureEffect: { statusType: 'injured', maxDuration: 1 }
})
export const MINING_PICK = attack('Pico de minero', 1.35, [8], 32, {
  onFailureEffect: { statusType: 'injured', maxDuration: 1 }
})
export const GRAVEL_SHOWER = attack('Lluvia de grava', 0.75, [8, 9, 8], 34)
export const SPIKE_TRAP = attack('Trampa de estacas', 0.8, [9, 8], 28, {
  onFailureEffect: { statusType: 'bleed', stacks: 2 }
})

const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
export const AncestralGuard: IAbility = {
  name: 'Guardia ancestral', type: 'mountainAncestralGuard', description: 'Protege al aliado enemigo más herido con un escudo de 20 puntos.',
  cooldown: 2, tags: ['buff'], icon: shieldIcon, targetType: 'allies-only', requiresTarget: false,
  execute: async ctx => {
    const ally = (ctx.allies ?? [ctx.caster]).filter(e => e.isAlive)
      .sort((a, b) => a.health / a.maxHealth - b.health / b.maxHealth)[0]
    if (ally) { ally.addStatusEffect({ ...StatusEffects.ANCESTRAL_GUARD }); ctx.log(`${ally.name} recibe Guardia ancestral.`) }
    await pause(ctx.animationDelay)
  }
}
registerAbility(AncestralGuard)

export const MountainMend: IAbility = {
  name: 'Cántico reparador', type: 'mountainMend', description: 'Cura 18 de vida al aliado enemigo más herido.',
  cooldown: 2, tags: ['heal'], icon: heartIcon, targetType: 'allies-only', requiresTarget: false,
  execute: async ctx => {
    const ally = (ctx.allies ?? [ctx.caster]).filter(e => e.isAlive)
      .sort((a, b) => a.health / a.maxHealth - b.health / b.maxHealth)[0]
    if (ally) { const before = ally.health; ally.heal(18); ctx.log(`${ally.name} recupera ${ally.health - before} HP.`) }
    await pause(ctx.animationDelay)
  }
}
registerAbility(MountainMend)

export const AttackOrder: IAbility = {
  name: 'Orden de ataque', type: 'mountainAttackOrder', description: 'Los enemigos aliados hacen +20% de daño durante 2 turnos.',
  cooldown: 3, tags: ['buff'], icon: swordIcon, targetType: 'allies-only', requiresTarget: false,
  execute: async ctx => {
    for (const ally of ctx.allies ?? [ctx.caster]) if (ally.isAlive) ally.addStatusEffect({ ...StatusEffects.ATTACK_ORDER })
    ctx.log('¡El capitán ordena avanzar! +20% de daño durante 2 turnos.')
    await pause(ctx.animationDelay)
  }
}
registerAbility(AttackOrder)

export const StonePreparation: IAbility = {
  name: 'Coraza pétrea — prepara Impacto', type: 'mountainStonePreparation',
  description: 'Reduce el daño recibido mientras prepara un golpe pesado. Después queda vulnerable.',
  cooldown: 2, tags: ['buff'], icon: shieldIcon, targetType: 'allies-only', requiresTarget: false,
  execute: async ctx => {
    ctx.caster.addStatusEffect({ ...StatusEffects.STONE_SHELL })
    ctx.log('El guardián prepara Impacto de la roca. ¡Aprovecha la vulnerabilidad después de su golpe!')
    await pause(ctx.animationDelay)
  }
}
registerAbility(StonePreparation)
