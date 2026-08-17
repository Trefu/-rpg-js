import type { IAbility } from '@/core/interfaces/IAbility'
import type { AbilityContext } from '@/core/interfaces/IAbility'
import type { Hero } from '../Hero'

const TIMING_PREFIX: Record<string, string> = {
  critical: '¡CRÍTICO! Usaste',
  bonus: '¡BONUS! Usaste',
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

const showCritAnnouncement = (context: AbilityContext) => {
  context.showAnnouncement(`¡CRÍTICO!`, 'crit', 1800)
}

export const createBasicAttackAbility = (): IAbility => ({
  name: 'Ataque Básico',
  description: 'Un ataque simple con daño bajo',
  type: 'attack',
  cooldown: 0,
  damage: 30,
  targetType: 'enemies-only',
  requiresTiming: true,
  execute: async (context: AbilityContext) => {
    const baseDamage = context.caster.attack()
    const multiplier = context.damageMultiplier ?? 1
    const finalDamage = Math.floor(baseDamage * multiplier)
    context.target.takeDamage(finalDamage)
    context.showEnemyHit(context.target.id, finalDamage)
    if (context.timingResult === 'critical') showCritAnnouncement(context)
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
  targetType: 'enemies-only',
  requiresTiming: true,
  execute: async (context: AbilityContext) => {
    const damage = Math.floor(context.caster.attack() * 0.8)
    context.target.takeDamage(damage)
    context.showEnemyHit(context.target.id, damage)
    if (context.timingResult === 'critical') showCritAnnouncement(context)
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
  targetType: 'enemies-only',
  requiresTiming: true,
  execute: async (context: AbilityContext) => {
    const damage = Math.floor(context.caster.attack() * 1.5)
    context.target.takeDamage(damage)
    context.showEnemyHit(context.target.id, damage)
    if (context.timingResult === 'critical') showCritAnnouncement(context)
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
  targetType: 'enemies-only',
  requiresTiming: true,
  execute: async (context: AbilityContext) => {
    const damage = Math.floor(context.caster.attack() * 1.5)
    context.target.takeDamage(damage)
    context.showEnemyHit(context.target.id, damage)
    if (context.timingResult === 'critical') showCritAnnouncement(context)
    context.addToLog(formatAbilityLog(
      `Lanzaste Bola de Fuego causando ${damage} de daño de fuego.`,
      context.timingResult
    ))
  }
})

export const createWarriorAttackAbility = (): IAbility => ({
  name: 'Ataque de Warrior',
  description: 'Golpe certero. Un critico hace X3 de dano y consume 20 de energia.',
  type: 'warriorAttack',
  cooldown: 0,
  energyCostOnCrit: 20,
  customCriticalMultiplier: 3.0,
  targetType: 'enemies-only',
  requiresTiming: true,
  execute: async (context: AbilityContext) => {
    const caster = context.caster as Hero
    const baseDamage = caster.attack()
    let multiplier = context.damageMultiplier ?? 1

    if (context.timingResult === 'critical') {
      const critCost = 20
      if (caster.energy < critCost) {
        context.addToLog('Energia insuficiente para el critico! Solo hara un golpe normal.')
        multiplier = 1.0
      } else {
        caster.spendEnergy(critCost)
      }
    }

    const finalDamage = Math.floor(baseDamage * multiplier)
    context.target.takeDamage(finalDamage)
    context.showEnemyHit(context.target.id, finalDamage)
    if (context.timingResult === 'critical' && multiplier > 1) {
      showCritAnnouncement(context)
    }
    context.addToLog(formatAbilityLog(
      `Usaste Ataque de Warrior causando ${finalDamage} de dano.`,
      context.timingResult
    ))
  }
})

export const createSecondWindAbility = (): IAbility => ({
  name: 'Segundo Aliento',
  description: 'Cura 20 de vida maxima y restaura 20 de energia.',
  type: 'secondWind',
  cooldown: 1,
  targetType: 'allies-only',
  requiresTiming: false,
  execute: async (context: AbilityContext) => {
    const target = context.target as Hero
    if (!target.isAlive) {
      context.addToLog('No puedes usar Segundo Aliento en un aliado inconsciente.')
      return
    }
    const healAmount = Math.floor(target.maxHealth * 0.10)
    target.heal(healAmount)
    target.restoreEnergy(20)
    context.addToLog(`Usaste Segundo Aliento en ${target.name}: cura ${healAmount} HP y restaura 20 energia.`)
    context.showAnnouncement('Segundo Aliento!', 'info', 1500)
  }
})