import type { IAbility } from '@/core/interfaces/IAbility'
import type { AbilityContext } from '@/core/interfaces/IAbility'
import type { Hero } from '../Hero'
import { StatusEffects } from '../StatusEffects'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const showCritAnnouncement = (context: AbilityContext) => {
  context.showAnnouncement(`¡CRÍTICO!`, 'crit', 1800)
}

const rollAndApplyDamage = (
  caster: Hero,
  rawDamage: number
): { finalDamage: number, isCrit: boolean } => {
  const baseDamage = Math.floor(rawDamage)
  if (baseDamage <= 0) return { finalDamage: 0, isCrit: false }
  const isCrit = caster.rollCrit()
  const finalDamage = isCrit
    ? Math.floor(baseDamage * caster.critDamageMultiplier)
    : baseDamage
  return { finalDamage, isCrit }
}

const buildAttackLog = (abilityName: string, damage: number, isCrit: boolean): string => {
  const base = `Usaste ${abilityName} causando ${damage} de daño.`
  return isCrit ? `¡CRÍTICO! ${base}` : base
}

export const createBasicAttackAbility = (): IAbility => ({
  name: 'Ataque Básico',
  description: 'Un ataque simple con daño bajo',
  type: 'attack',
  cooldown: 0,
  targetType: 'enemies-only',
  execute: async (context: AbilityContext) => {
    const caster = context.caster as Hero
    const { finalDamage, isCrit } = rollAndApplyDamage(caster, caster.attack())
    if (finalDamage > 0) {
      context.target.takeDamage(finalDamage)
      context.showEnemyHit(context.target.id, finalDamage)
      context.audioManager.playAttackSound()
    }
    if (isCrit) showCritAnnouncement(context)
    context.addToLog(buildAttackLog('Ataque Básico', finalDamage, isCrit))
    await sleep(context.animationDelay)
  }
})

export const createStunStrikeAbility = (): IAbility => ({
  name: 'Golpe Aturdidor',
  description: 'Un golpe que puede aturdir al enemigo',
  type: 'stunStrike',
  cooldown: 3,
  targetType: 'enemies-only',
  execute: async (context: AbilityContext) => {
    const caster = context.caster as Hero
    const { finalDamage, isCrit } = rollAndApplyDamage(caster, caster.attack() * 0.8)
    if (finalDamage > 0) {
      context.target.takeDamage(finalDamage)
      context.showEnemyHit(context.target.id, finalDamage)
      context.audioManager.playAttackSound()
    }
    if (isCrit) showCritAnnouncement(context)
    context.addToLog(buildAttackLog('Golpe Aturdidor', finalDamage, isCrit))
    await sleep(context.animationDelay)
  }
})

export const createStealthStrikeAbility = (): IAbility => ({
  name: 'Golpe Sigiloso',
  description: 'Ataque furtivo que hace más daño',
  type: 'stealthStrike',
  cooldown: 2,
  targetType: 'enemies-only',
  execute: async (context: AbilityContext) => {
    const caster = context.caster as Hero
    const { finalDamage, isCrit } = rollAndApplyDamage(caster, caster.attack() * 1.5)
    if (finalDamage > 0) {
      context.target.takeDamage(finalDamage)
      context.showEnemyHit(context.target.id, finalDamage)
      context.audioManager.playAttackSound()
    }
    if (isCrit) showCritAnnouncement(context)
    context.addToLog(buildAttackLog('Golpe Sigiloso', finalDamage, isCrit))
    await sleep(context.animationDelay)
  }
})

export const createFireballAbility = (): IAbility => ({
  name: 'Bola de Fuego',
  description: 'Hechizo de fuego que causa daño mágico',
  type: 'fireball',
  cooldown: 3,
  targetType: 'enemies-only',
  execute: async (context: AbilityContext) => {
    const caster = context.caster as Hero
    const { finalDamage, isCrit } = rollAndApplyDamage(caster, caster.attack() * 1.5)
    if (finalDamage > 0) {
      context.target.takeDamage(finalDamage)
      context.showEnemyHit(context.target.id, finalDamage)
      context.audioManager.playAttackSound()
    }
    if (isCrit) showCritAnnouncement(context)
    context.addToLog(buildAttackLog('Bola de Fuego', finalDamage, isCrit))
    await sleep(context.animationDelay)
  }
})

export const createWarriorAttackAbility = (): IAbility => ({
  name: 'Tajo Devastador',
  description: 'Un tajo certero que siempre cuesta 20 de energia.',
  type: 'warriorDevastatingStrike',
  cooldown: 0,
  energyCost: 20,
  targetType: 'enemies-only',
  execute: async (context: AbilityContext) => {
    const caster = context.caster as Hero
    const extraDamage = 25 * caster.level
    const { finalDamage, isCrit } = rollAndApplyDamage(caster, (caster.attack() + extraDamage))
    if (finalDamage > 0) {
      context.target.takeDamage(finalDamage)
      context.showEnemyHit(context.target.id, finalDamage)
      context.audioManager.playAttackSound()
    }
    if (isCrit) showCritAnnouncement(context)
    context.addToLog(buildAttackLog('Tajo Devastador', finalDamage, isCrit))
    await sleep(context.animationDelay)
  }
})

export const createWarriorBasicAttackAbility = (): IAbility => ({
  name: 'Golpe Lesionador',
  description: 'Un tajo vertical preciso que inflige dano y aplica el debufo "Lesionado" al objetivo durante 1 turno. Cuesta energia.',
  type: 'warriorInjuringStrike',
  cooldown: 0,
  energyCost: 20,
  targetType: 'enemies-only',
  animationDurationMs: 800,
  execute: async (context: AbilityContext) => {
    const caster = context.caster as Hero
    const target = context.target as any

    const { finalDamage, isCrit } = rollAndApplyDamage(caster, caster.attack())
    if (finalDamage > 0) {
      target.takeDamage(finalDamage)
      context.showEnemyHit(target.id, finalDamage)
      context.audioManager.playAttackSound()
    }
    if (isCrit) showCritAnnouncement(context)
    context.addToLog(buildAttackLog('Golpe Lesionador', finalDamage, isCrit))

    if (target && typeof target.addStatusEffect === 'function' && target.isAlive) {
      const template = StatusEffects.INJURED
      const baseTurns = template.turns
      const turns = baseTurns + Math.floor((caster.level - 1) / 2)
      target.addStatusEffect({ ...template, turns })
      context.addToLog(`¡${target.name} ha sido Lesionado${turns > 1 ? ' durante ' + turns + ' turnos' : ''}!`)
      context.showAnnouncement(`¡Lesionado${turns > 1 ? ' x' + turns : ''}!`, 'status', 1500)
    }

    await sleep(context.animationDelay)
  }
})

export const createSecondWindAbility = (): IAbility => ({
  name: 'Segundo Aliento',
  description: 'Cura 20% de vida maxima y aplica el buff Segundo Aliento: cada bloqueo siguiente restaura 2% de la energia maxima (5 bloqueos).',
  type: 'secondWind',
  cooldown: 1,
  targetType: 'allies-only',
  requiresTarget: false,
  animationDurationMs: 1200,
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
    await sleep(context.animationDelay)
  }
})
