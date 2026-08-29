import type { IAbility } from '@/core/interfaces/IAbility'
import type { AbilityContext, TimingResult } from '@/core/interfaces/IAbility'
import type { Hero } from '../Hero'
import { StatusEffects } from '../StatusEffects'

const TIMING_PREFIX: Record<TimingResult, string> = {
  critical: '¡CRÍTICO! Usaste',
  bonus: '¡BONUS! Usaste',
  normal: 'Usaste',
  miss: 'Fallaste al usar'
}

const BASIC_ATTACK_TIMING_SCALING: Record<TimingResult, number> = {
  critical: 2.0,
  bonus: 1.5,
  normal: 1.0,
  miss: 0.25
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
    const timingResult: TimingResult = context.timingResult ?? 'normal'
    const multiplier = BASIC_ATTACK_TIMING_SCALING[timingResult]
    const finalDamage = Math.floor(baseDamage * multiplier)
    context.target.takeDamage(finalDamage)
    context.showEnemyHit(context.target.id, finalDamage)
    if (timingResult === 'critical') showCritAnnouncement(context)
    context.addToLog(formatAbilityLog(
      `Usaste Ataque Básico causando ${finalDamage} de daño.`,
      timingResult
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

export const createWarriorAttackAbility = (customCriticalMultiplier: number = 3.0): IAbility => ({
  name: 'Tajo Devastador',
  description: `Un tajo certero que siempre cuesta 20 de energia. Un critico inflige X${customCriticalMultiplier} de dano.`,
  type: 'warriorDevastatingStrike',
  cooldown: 0,
  energyCost: 20,
  customCriticalMultiplier,
  targetType: 'enemies-only',
  requiresTiming: true,
  execute: async (context: AbilityContext) => {
    const caster = context.caster as Hero
    const baseDamage = caster.attack()
    const timingResult: TimingResult = context.timingResult ?? 'normal'

    const multiplier =
      timingResult === 'critical'
        ? customCriticalMultiplier
        : BASIC_ATTACK_TIMING_SCALING[timingResult]

    const finalDamage = Math.floor(baseDamage * multiplier)
    context.target.takeDamage(finalDamage)
    context.showEnemyHit(context.target.id, finalDamage)
    if (timingResult === 'critical' && multiplier > 1) {
      showCritAnnouncement(context)
    }
    context.addToLog(formatAbilityLog(
      `Usaste Tajo Devastador causando ${finalDamage} de dano.`,
      timingResult
    ))
  }
})

export const createWarriorBasicAttackAbility = (): IAbility => ({
  name: 'Corte Vertical',
  description: 'Tres tajos verticales encadenados tras un unico desafio de timing. Cuesta energia, hace triple de dano y golpea 3 veces con su propia animacion.',
  type: 'warriorVerticalSlash',
  cooldown: 0,
  energyCost: 30,
  targetType: 'enemies-only',
  requiresTiming: true,
  execute: async (context: AbilityContext) => {
    const caster = context.caster as Hero
    const target = context.target
    const baseDamage = caster.attack()
    const timingResult: TimingResult = context.timingResult ?? 'normal'
    const timingMultiplier = BASIC_ATTACK_TIMING_SCALING[timingResult]
    const strikes = 3
    const damageMultiplier = 3
    const strikeDelay = 550

    context.addToLog(`Usaste Corte Vertical: una rafaga de ${strikes} tajos.`)
    if (timingResult === 'critical') showCritAnnouncement(context)

    for (let strikeIndex = 0; strikeIndex < strikes; strikeIndex++) {
      const finalDamage = Math.floor(baseDamage * timingMultiplier * damageMultiplier)
      target.takeDamage(finalDamage)
      context.showEnemyHit(target.id, finalDamage)
      context.showAnnouncement(`¡Tajo ${strikeIndex + 1}/${strikes}!`, 'attack', 650)

      context.addToLog(formatAbilityLog(
        `Corte Vertical (${strikeIndex + 1}/${strikes}) inflige ${finalDamage} de dano.`,
        timingResult
      ))

      if (strikeIndex < strikes - 1) {
        await new Promise(resolve => setTimeout(resolve, strikeDelay))
      }
    }
  }
})

export const createSecondWindAbility = (): IAbility => ({
  name: 'Segundo Aliento',
  description: 'Cura 20% de vida maxima y aplica el buff Segundo Aliento: cada bloqueo siguiente restaura 2% de la energia maxima (5 bloqueos).',
  type: 'secondWind',
  cooldown: 1,
  targetType: 'allies-only',
  requiresTiming: false,
  execute: async (context: AbilityContext) => {
    const caster = context.caster as Hero
    if (!caster.isAlive) {
      context.addToLog('No puedes usar Segundo Aliento estando inconsciente.')
      return
    }
    const healAmount = Math.floor(caster.maxHealth * 0.20)
    caster.heal(healAmount)

    const buffTemplate = StatusEffects.SECOND_WIND
    const maxCharges = buffTemplate.maxCharges ?? buffTemplate.charges ?? 5
    const existing = caster.statusEffects.find(e => e.type === buffTemplate.type)
    if (existing) {
      existing.charges = maxCharges
      existing.maxCharges = maxCharges
      existing.turns = Infinity
      existing.onBlock = buffTemplate.onBlock
    } else {
      caster.addStatusEffect({
        ...buffTemplate,
        charges: maxCharges,
        maxCharges,
        turns: Infinity
      })
    }

    context.addToLog(
      `Usaste Segundo Aliento: cura ${healAmount} HP y activa el buff (${maxCharges} cargas).`
    )
    context.showAnnouncement('Segundo Aliento!', 'info', 1500)
  }
})