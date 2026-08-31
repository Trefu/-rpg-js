import type { IAbility } from '@/core/interfaces/IAbility'
import type { AbilityContext } from '@/core/interfaces/IAbility'
import type { Hero } from '../Hero'
import { StatusEffects, DOT_STATUS_TYPES } from '../StatusEffects'

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

export const BasicAttack: IAbility = {
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
}

export const StunStrike: IAbility = {
    name: 'Golpe Aturdidor',
    description: 'Un golpe que puede aturdir al enemigo',
    type: 'stunStrike',
    cooldown: 3,
    energyCost: 15,
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
}

export const StealthStrike: IAbility = {
    name: 'Golpe Sigiloso',
    description: 'Ataque furtivo que hace más daño',
    type: 'stealthStrike',
    cooldown: 2,
    energyCost: 15,
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
}

export const Fireball: IAbility = {
    name: 'Bola de Fuego',
    description: 'Hechizo de fuego que causa daño mágico',
    type: 'fireball',
    cooldown: 3,
    energyCost: 25,
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
}

export const WarriorInjuringStrike: IAbility = {
    name: 'Golpe Lesionador',
    description: 'Un tajo vertical preciso que inflige daño y aplica el debufo "Lesionado" al objetivo durante 1 turno.',
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
            const warriorInjuringStrikeExtraInjuredTurns = 1
            const baseTurns = template.turns + warriorInjuringStrikeExtraInjuredTurns
            const turns = baseTurns + Math.floor((caster.level - 1) / 2)
            target.addStatusEffect({ ...template, turns })
            context.addToLog(`¡${target.name} ha sido Lesionado${turns > 1 ? ' durante ' + turns + ' turnos' : ''}!`)
            context.showAnnouncement(`¡Lesionado${turns > 1 ? ' x' + turns : ''}!`, 'status', 1500)
        }

        await sleep(context.animationDelay)
    }
}

export const WarriorDevastatingStrike: IAbility = {
    name: 'Golpe Devastador',
    description: 'Un golpe devastador que golpea a todos los enemigos con el mismo daño.',
    type: 'warriorDevastatingStrike',
    cooldown: 0,
    energyCost: 20,
    targetType: 'enemies-only',
    aoe: true,
    execute: async (context: AbilityContext) => {
        const caster = context.caster as Hero
        const extraDamage = 25 * caster.level
        const { finalDamage, isCrit } = rollAndApplyDamage(caster, (caster.attack() + extraDamage))
        context.lastPrimaryFinalDamage = finalDamage
        if (isCrit) showCritAnnouncement(context)
    }
}

export const SecondWind: IAbility = {
    name: 'Segundo Aliento',
    description: 'Cura 20% de vida maxima y aplica el buff Segundo Aliento: cada bloqueo siguiente restaura 2% de la energia maxima (5 bloqueos).',
    type: 'secondWind',
    cooldown: 1,
    energyCost: 20,
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
}

export const ClericRadiantStrike: IAbility = {
    name: 'Luz Sagrada',
    description: 'Un destello radiante que causa daño sagrado al objetivo y puede saltar a 1-2 enemigos adicionales cercanos.',
    type: 'clericRadiantStrike',
    cooldown: 0,
    energyCost: 25,
    targetType: 'enemies-only',
    randomAttack: {
        minExtraTargets: 1,
        maxExtraTargets: 2,
        damageMultiplier: 0.6
    },
    execute: async (context: AbilityContext) => {
        const caster = context.caster as Hero
        const baseDamage = caster.attack() * 1.8
        const { finalDamage, isCrit } = rollAndApplyDamage(caster, baseDamage)
        context.lastPrimaryBaseDamage = baseDamage
        if (finalDamage > 0) {
            context.target.takeDamage(finalDamage)
            context.showEnemyHit(context.target.id, finalDamage)
            context.audioManager.playAttackSound()
        }
        if (isCrit) showCritAnnouncement(context)
        context.addToLog(buildAttackLog('Luz Sagrada', finalDamage, isCrit))
        await sleep(context.animationDelay)
    }
}

export const ClericDivineSmite: IAbility = {
    name: 'Castigo Divino',
    description: 'Un ataque radiante imbuido de fe pura.',
    type: 'clericDivineSmite',
    cooldown: 0,
    energyCost: 20,
    targetType: 'enemies-only',
    execute: async (context: AbilityContext) => {
        const caster = context.caster as Hero
        const extraDamage = 18 * caster.level
        const { finalDamage, isCrit } = rollAndApplyDamage(caster, caster.attack() * 1.2 + extraDamage)
        if (finalDamage > 0) {
            context.target.takeDamage(finalDamage)
            context.showEnemyHit(context.target.id, finalDamage)
            context.audioManager.playAttackSound()
        }
        if (isCrit) showCritAnnouncement(context)
        context.addToLog(buildAttackLog('Castigo Divino', finalDamage, isCrit))
        await sleep(context.animationDelay)
    }
}

export const ClericHeal: IAbility = {
    name: 'Curar Heridas',
    description: 'Canaliza luz radiante para restaurar 30% de la vida maxima de un aliado (incluido el caster) y eliminar todos los efectos de dano por tiempo (Quemadura, Veneno, Congelado).',
    type: 'clericHeal',
    cooldown: 2,
    energyCost: 15,
    targetType: 'allies-only',
    execute: async (context: AbilityContext) => {
        const caster = context.caster as Hero
        const target = context.target as Hero
        if (!target || !target.isAlive) {
            context.addToLog('No hay un aliado valido para curar.')
            return
        }
        const healAmount = Math.floor(target.maxHealth * 0.30)
        const before = target.health
        target.heal(healAmount)
        const restored = target.health - before

        const cleansed: string[] = []
        const dotEffects = target.statusEffects.filter(e => DOT_STATUS_TYPES.has(e.type))
        for (const effect of dotEffects) {
            target.removeStatusEffect(effect.type)
            cleansed.push(StatusEffects.getByType(effect.type)?.name ?? effect.type)
        }

        const parts: string[] = []
        if (restored > 0) {
            parts.push(
                target === caster
                    ? `Te curaste ${restored} HP con luz radiante`
                    : `Curaste a ${target.name} ${restored} HP`
            )
        }
        if (cleansed.length > 0) {
            parts.push(`y eliminaste ${cleansed.join(', ')}`)
        }
        context.addToLog(parts.length > 0 ? `${parts.join(' ')}.` : `La luz radiante no tuvo efecto sobre ${target.name}.`)
        context.showAnnouncement('Curar Heridas', 'info', 1500)
        await sleep(context.animationDelay)
    }
}
