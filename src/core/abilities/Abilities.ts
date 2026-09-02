import type { IAbility, DamageType } from '@/core/interfaces/IAbility'
import type { AbilityContext } from '@/core/interfaces/IAbility'
import { DAMAGE_TYPE_LABELS } from '@/core/interfaces/IAbility'
import type { Hero } from '../Hero'
import { StatusEffects, DOT_STATUS_TYPES } from '../StatusEffects'
import type { CritResult } from '../crit'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const showCritAnnouncement = (context: AbilityContext, damage: number, isOvercrit: boolean = false) => {
    const dmgType = context.ability?.damageType as DamageType | undefined
    const typeLabel = dmgType ? DAMAGE_TYPE_LABELS[dmgType] : 'Físico'
    const prefix = isOvercrit ? '¡Overcrit!' : 'Crítico'
    context.showAnnouncement(`${prefix} ${damage} ${typeLabel}`, 'crit', 1800, { priority: 100, interrupt: true })
}

const rollAndApplyDamage = (
    caster: Hero,
    rawDamage: number
): { finalDamage: number, crit: CritResult } => {
    const baseDamage = Math.floor(rawDamage)
    if (baseDamage <= 0) {
        return { finalDamage: 0, crit: { multiplier: 1, isCrit: false, isOvercrit: false } }
    }
    const crit = caster.rollCrit()
    const finalDamage = crit.isCrit
        ? Math.floor(baseDamage * crit.multiplier)
        : baseDamage
    return { finalDamage, crit }
}

const buildAttackLog = (abilityName: string, damage: number, crit: CritResult): string => {
    const base = `Usaste ${abilityName} causando ${damage} de daño.`
    if (crit.isOvercrit) return `¡Overcrit! ${base}`
    if (crit.isCrit) return `Crítico ${base}`
    return base
}

/**
 * Reproduce el SFX de la ability: si la ability define `customSound`,
 * se reproduce ese (pasado al `playCustomSound` del AudioManager);
 * si no, se usa el fallback generico `playAttackSound`.
 */
const playAbilitySfx = (
    audioManager: AbilityContext['audioManager'],
    ability: IAbility | undefined
): void => {
    const custom = ability?.customSound
    if (custom) audioManager.playCustomSound(custom)
    else audioManager.playAttackSound()
}

export const BasicAttack: IAbility = {
    name: 'Ataque Básico',
    description: 'Un ataque simple con daño bajo',
    type: 'attack',
    cooldown: 0,
    damageType: 'physical',
    targetType: 'enemies-only',
    execute: async (context: AbilityContext) => {
        const caster = context.caster as Hero
        const rawDamage = caster.baseStats.body.value * 0.7 + caster.level
        const { finalDamage, crit } = rollAndApplyDamage(caster, rawDamage)
        if (finalDamage > 0) {
            context.target.takeDamage(finalDamage)
            context.showEnemyHit(context.target.id, finalDamage, crit.isCrit)
            playAbilitySfx(context.audioManager, context.ability)
        }
        if (crit.isCrit) showCritAnnouncement(context, finalDamage, crit.isOvercrit)
        context.addToLog(buildAttackLog('Ataque Básico', finalDamage, crit))
        if (typeof caster.restoreEnergy === 'function') {
            const restored = caster.restoreEnergy(5)
            if (restored > 0) context.addToLog(`+${restored} de energía.`)
        }
        await sleep(context.animationDelay)
    }
}

export const StunStrike: IAbility = {
    name: 'Golpe Aturdidor',
    description: 'Un golpe que puede aturdir al enemigo',
    type: 'stunStrike',
    cooldown: 3,
    energyCost: 15,
    damageType: 'physical',
    targetType: 'enemies-only',
    execute: async (context: AbilityContext) => {
        const caster = context.caster as Hero
        const rawDamage = (caster.baseStats.body.value * 0.7 + caster.level * 0.5) * 0.8
        const { finalDamage, crit } = rollAndApplyDamage(caster, rawDamage)
        if (finalDamage > 0) {
            context.target.takeDamage(finalDamage)
            context.showEnemyHit(context.target.id, finalDamage, crit.isCrit)
            playAbilitySfx(context.audioManager, context.ability)
        }
        if (crit.isCrit) showCritAnnouncement(context, finalDamage, crit.isOvercrit)
        context.addToLog(buildAttackLog('Golpe Aturdidor', finalDamage, crit))
        await sleep(context.animationDelay)
    }
}

export const StealthStrike: IAbility = {
    name: 'Golpe Sigiloso',
    description: 'Ataque furtivo que hace más daño',
    type: 'stealthStrike',
    cooldown: 2,
    energyCost: 15,
    damageType: 'physical',
    targetType: 'enemies-only',
    execute: async (context: AbilityContext) => {
        const caster = context.caster as Hero
        const rawDamage = (caster.baseStats.body.value * 0.7 + caster.level * 0.5) * 1.5
        const { finalDamage, crit } = rollAndApplyDamage(caster, rawDamage)
        if (finalDamage > 0) {
            context.target.takeDamage(finalDamage)
            context.showEnemyHit(context.target.id, finalDamage, crit.isCrit)
            playAbilitySfx(context.audioManager, context.ability)
        }
        if (crit.isCrit) showCritAnnouncement(context, finalDamage, crit.isOvercrit)
        context.addToLog(buildAttackLog('Golpe Sigiloso', finalDamage, crit))
        await sleep(context.animationDelay)
    }
}

export const Fireball: IAbility = {
    name: 'Bola de Fuego',
    description: 'Hechizo de fuego que causa daño mágico',
    type: 'fireball',
    cooldown: 3,
    energyCost: 25,
    damageType: 'fire',
    targetType: 'enemies-only',
    execute: async (context: AbilityContext) => {
        const caster = context.caster as Hero
        const rawDamage = caster.baseStats.mind.value * 2.5
        const { finalDamage, crit } = rollAndApplyDamage(caster, rawDamage)
        if (finalDamage > 0) {
            context.target.takeDamage(finalDamage)
            context.showEnemyHit(context.target.id, finalDamage, crit.isCrit)
            playAbilitySfx(context.audioManager, context.ability)
        }
        if (crit.isCrit) showCritAnnouncement(context, finalDamage, crit.isOvercrit)
        context.addToLog(buildAttackLog('Bola de Fuego', finalDamage, crit))
        await sleep(context.animationDelay)
    }
}

export const WarriorInjuringStrike: IAbility = {
    name: 'Golpe Lesionador',
    description: 'Un tajo vertical preciso que inflige daño y aplica el debufo "Lesionado" al objetivo durante 1 turno.',
    type: 'warriorInjuringStrike',
    cooldown: 0,
    energyCost: 20,
    damageType: 'physical',
    targetType: 'enemies-only',
    animationDurationMs: 800,
    execute: async (context: AbilityContext) => {
        const caster = context.caster as Hero
        const target = context.target as any

        const rawDamage = caster.baseStats.body.value * 0.7 + caster.level * 0.5
        const { finalDamage, crit } = rollAndApplyDamage(caster, rawDamage)
        if (finalDamage > 0) {
            target.takeDamage(finalDamage)
            context.showEnemyHit(target.id, finalDamage, crit.isCrit)
            playAbilitySfx(context.audioManager, context.ability)
        }
        if (crit.isCrit) showCritAnnouncement(context, finalDamage, crit.isOvercrit)
        context.addToLog(buildAttackLog('Golpe Lesionador', finalDamage, crit))

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
    energyCost: 35,
    damageType: 'physical',
    targetType: 'enemies-only',
    aoe: true,
    execute: async (context: AbilityContext) => {
        const caster = context.caster as Hero
        const rawDamage = caster.baseStats.body.value * 1.5 + caster.level * 3
        const { finalDamage, crit } = rollAndApplyDamage(caster, rawDamage)
        context.lastPrimaryFinalDamage = finalDamage
        if (crit.isCrit) showCritAnnouncement(context, finalDamage, crit.isOvercrit)
    }
}

const SECOND_WIND_HEAL_PCT = 0.20
const SECOND_WIND_ENERGY_RESTORE_PCT = 0.10
const SECOND_WIND_CHARGES = 3

export const SecondWind: IAbility = {
    name: 'Segundo Aliento',
    description: `Cura ${Math.round(SECOND_WIND_HEAL_PCT * 100)}% de vida maxima y aplica el buff Segundo Aliento: cada bloqueo siguiente restaura ${Math.round(SECOND_WIND_ENERGY_RESTORE_PCT * 100)}% de la energia maxima (${SECOND_WIND_CHARGES} bloqueos).`,
    type: 'secondWind',
    cooldown: 2,
    energyCost: 0,
    targetType: 'allies-only',
    requiresTarget: false,
    animationDurationMs: 1200,
    customSound: '/assets/sounds/Buffs_Heals_SFX/Def_buff.wav',
    execute: async (context: AbilityContext) => {
        const caster = context.caster as Hero
        if (!caster.isAlive) {
            context.addToLog('No puedes usar Segundo Aliento estando inconsciente.')
            return
        }
        const mindBonus = Math.floor(caster.baseStats.mind.value * 0.5)
        const healAmount = Math.floor(caster.maxHealth * SECOND_WIND_HEAL_PCT) + mindBonus
        caster.heal(healAmount)

        const buffTemplate = StatusEffects.SECOND_WIND
        const maxCharges = SECOND_WIND_CHARGES
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
        playAbilitySfx(context.audioManager, context.ability)
        await sleep(context.animationDelay)
    }
}

export const ClericRadiantStrike: IAbility = {
    name: 'Luz Sagrada',
    description: 'Un destello radiante que causa daño sagrado al objetivo y puede saltar a 1-2 enemigos adicionales cercanos.',
    type: 'clericRadiantStrike',
    cooldown: 0,
    energyCost: 30,
    damageType: 'holy',
    targetType: 'enemies-only',
    randomAttack: {
        minExtraTargets: 1,
        maxExtraTargets: 2,
        damageMultiplier: 0.6
    },
    execute: async (context: AbilityContext) => {
        const caster = context.caster as Hero
        const baseDamage = caster.baseStats.mind.value * 2.6
        const { finalDamage, crit } = rollAndApplyDamage(caster, baseDamage)
        context.lastPrimaryBaseDamage = baseDamage
        if (finalDamage > 0) {
            context.target.takeDamage(finalDamage)
            context.showEnemyHit(context.target.id, finalDamage, crit.isCrit)
            playAbilitySfx(context.audioManager, context.ability)
        }
        if (crit.isCrit) showCritAnnouncement(context, finalDamage, crit.isOvercrit)
        context.addToLog(buildAttackLog('Luz Sagrada', finalDamage, crit))
        await sleep(context.animationDelay)
    }
}

export const ClericDivineSmite: IAbility = {
    name: 'Castigo Divino',
    description: 'Un ataque radiante imbuido de fe pura.',
    type: 'clericDivineSmite',
    cooldown: 0,
    energyCost: 40,
    damageType: 'holy',
    targetType: 'enemies-only',
    execute: async (context: AbilityContext) => {
        const caster = context.caster as Hero
        const { finalDamage, crit } = rollAndApplyDamage(caster, caster.baseStats.mind.value * 4)
        if (finalDamage > 0) {
            context.target.takeDamage(finalDamage)
            context.showEnemyHit(context.target.id, finalDamage, crit.isCrit)
            playAbilitySfx(context.audioManager, context.ability)
        }
        if (crit.isCrit) showCritAnnouncement(context, finalDamage, crit.isOvercrit)
        context.addToLog(buildAttackLog('Castigo Divino', finalDamage, crit))
        await sleep(context.animationDelay)
    }
}

export const ClericHeal: IAbility = {
    name: 'Curar Heridas',
    description: 'Canaliza luz radiante para restaurar 30% (+ bono por mente) de la vida maxima de un aliado (incluido el caster) y eliminar todos los efectos de dano por tiempo (Quemadura, Veneno, Congelado).',
    type: 'clericHeal',
    cooldown: 0,
    energyCost: 30,
    targetType: 'allies-only',
    execute: async (context: AbilityContext) => {
        const caster = context.caster as Hero
        const target = context.target as Hero
        if (!target || !target.isAlive) {
            context.addToLog('No hay un aliado valido para curar.')
            return
        }
        const healAmount = Math.floor(target.maxHealth * 0.30 + caster.baseStats.mind.value * 2)
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
