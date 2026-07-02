import type { IAbility } from '@/core/interfaces/IAbility'
import type { AbilityContext } from '@/core/interfaces/IAbility'

const TIMING_PREFIX: Record<string, string> = {
  perfect: '¡PERFECTO! Usaste',
  good: '¡CRÍTICO! Usaste',
  normal: 'Usaste',
  miss: 'Fallaste al usar'
}

const formatAbilityLog = (
  baseMessage: string,
  timingResult: AbilityContext['timingResult']
): string => {
  if (!timingResult) return baseMessage
  const prefix = TIMING_PREFIX[timingResult] ?? 'Usaste'
  return baseMessage.replace(/^Usaste|^Lanzaste|^Fallaste al usar/, prefix)
}

export const createBasicAttackAbility = (): IAbility => ({
  name: 'Ataque Básico',
  description: 'Un ataque simple con daño bajo',
  type: 'attack',
  cooldown: 0,
  damage: 30,
  execute: async (context: AbilityContext) => {
    const baseDamage = context.caster.attack()
    const multiplier = context.damageMultiplier ?? 1
    const finalDamage = Math.floor(baseDamage * multiplier)
    context.target.takeDamage(finalDamage)
    context.showEnemyHit(context.target.id, finalDamage)
    context.addToLog(formatAbilityLog(
      `Usaste Ataque Básico causando ${finalDamage} de daño.`,
      context.timingResult
    ))
  }
})

export const createStunStrikeAbility = (): IAbility => ({
  name: 'Golpe Aturdidor',
  description: 'Un golpe que puede aturdir al enemigo',
  type: 'stunStrike',
  cooldown: 3,
  damage: 50,
  execute: async (context: AbilityContext) => {
    const damage = Math.floor(context.caster.attack() * 0.8)
    context.target.takeDamage(damage)
    context.showEnemyHit(context.target.id, damage)
    context.addToLog(formatAbilityLog(
      `Usaste Golpe Aturdidor causando ${damage} de daño.`,
      context.timingResult
    ))
  }
})

export const createStealthStrikeAbility = (): IAbility => ({
  name: 'Golpe Sigiloso',
  description: 'Ataque furtivo que hace más daño',
  type: 'stealthStrike',
  cooldown: 2,
  damage: 70,
  execute: async (context: AbilityContext) => {
    const damage = Math.floor(context.caster.attack() * 1.5)
    context.target.takeDamage(damage)
    context.showEnemyHit(context.target.id, damage)
    context.addToLog(formatAbilityLog(
      `Usaste Golpe Sigiloso causando ${damage} de daño.`,
      context.timingResult
    ))
  }
})

export const createFireballAbility = (): IAbility => ({
  name: 'Bola de Fuego',
  description: 'Hechizo de fuego que causa daño mágico',
  type: 'fireball',
  cooldown: 3,
  damage: 90,
  execute: async (context: AbilityContext) => {
    const damage = Math.floor(context.caster.attack() * 1.5)
    context.target.takeDamage(damage)
    context.showEnemyHit(context.target.id, damage)
    context.addToLog(formatAbilityLog(
      `Lanzaste Bola de Fuego causando ${damage} de daño de fuego.`,
      context.timingResult
    ))
  }
})