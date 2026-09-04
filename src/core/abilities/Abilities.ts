import type { IAbility, DamageType, AbilityDamagePreview } from '@/core/interfaces/IAbility'
import type { AbilityContext } from '@/core/interfaces/IAbility'
import { DAMAGE_TYPE_LABELS } from '@/core/interfaces/IAbility'
import type { Hero } from '../Hero'
import { StatusEffects, DOT_STATUS_TYPES } from '../StatusEffects'
import type { CritResult } from '../crit'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Multiplicador minimo y maximo aplicado al daño base antes del critico.
 * Define la "ventana de variabilidad" del daño en este juego (estilo Diablo/LoL):
 * el golpe real fluctúa dentro de este rango en cada uso, manteniendo el promedio
 * igual al valor base. Centralizado aquí para que los enemigos (que copian la
 * mecánica) y los heroes compartan el mismo balance.
 */
export const DAMAGE_VARIANCE_MIN = 0.90
export const DAMAGE_VARIANCE_MAX = 1.10

export interface DamageVarianceRange {
    min: number
    max: number
}

const DEFAULT_VARIANCE_RANGE: DamageVarianceRange = {
    min: DAMAGE_VARIANCE_MIN,
    max: DAMAGE_VARIANCE_MAX
}

/**
 * Aplica la varianza aleatoria al daño base: lo multiplica por un factor uniforme
 * en `[min, max]`. Se aplica ANTES del critico para que el critico escale un
 * valor ya fluctuante (consistente con la mayoría de RPGs).
 */
export const applyDamageVariance = (
    amount: number,
    range: DamageVarianceRange = DEFAULT_VARIANCE_RANGE
): number => {
    if (amount <= 0) return 0
    const { min, max } = range
    const lo = Math.min(min, max)
    const hi = Math.max(min, max)
    const factor = lo + Math.random() * (hi - lo)
    return Math.max(0, Math.floor(amount * factor))
}

/**
 * Dado un daño base sin varianza, devuelve el rango min/max que el modal muestra.
 * `min` usa el factor minimo de varianza, `max` el maximo.
 */
const computeDamageRange = (raw: number, range: DamageVarianceRange = DEFAULT_VARIANCE_RANGE): { min: number, max: number } => {
    if (raw <= 0) return { min: 0, max: 0 }
    const lo = Math.min(range.min, range.max)
    const hi = Math.max(range.min, range.max)
    return {
        min: Math.max(0, Math.floor(raw * lo)),
        max: Math.max(0, Math.floor(raw * hi))
    }
}

const showCritAnnouncement = (context: AbilityContext, damage: number, isOvercrit: boolean = false) => {
    const dmgType = context.ability?.damageType as DamageType | undefined
    const typeLabel = dmgType ? DAMAGE_TYPE_LABELS[dmgType] : 'Físico'
    const prefix = isOvercrit ? '¡Overcrit!' : 'Crítico'
    context.showAnnouncement(`${prefix} ${damage} ${typeLabel}`, 'crit', 1800, { priority: 100, interrupt: true })
}

const rollAndApplyDamage = (
    caster: Hero,
    rawDamage: number,
    range: DamageVarianceRange = DEFAULT_VARIANCE_RANGE
): { finalDamage: number, crit: CritResult, baseDamage: number } => {
    const baseDamage = applyDamageVariance(rawDamage, range)
    if (baseDamage <= 0) {
        return { finalDamage: 0, crit: { multiplier: 1, isCrit: false, isOvercrit: false }, baseDamage: 0 }
    }
    const crit = caster.rollCrit()
    const finalDamage = crit.isCrit
        ? Math.floor(baseDamage * crit.multiplier)
        : baseDamage
    return { finalDamage, crit, baseDamage }
}

const buildAttackLog = (abilityName: string, damage: number, crit: CritResult): string => {
    const base = `Usaste ${abilityName} causando ${damage} de daño.`
    if (crit.isOvercrit) return `¡Overcrit! ${base}`
    if (crit.isCrit) return `Crítico ${base}`
    return base
}

/**
 * Helper para construir el previewDamage de una ability. Centraliza la
 * generación del rango y la metadata para que cada ability solo pase
 * su fórmula con los valores del caster ya sustituidos.
 */
const buildPreview = (
    formula: string,
    raw: number,
    damageType?: DamageType
): AbilityDamagePreview => {
    const { min, max } = computeDamageRange(raw)
    return {
        min,
        max,
        formula,
        damageTypeLabel: damageType ? DAMAGE_TYPE_LABELS[damageType] : undefined
    }
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
    previewDamage: (hero: Hero) => {
        const body = hero.baseStats.body.value
        const level = hero.level
        const raw = body * 0.7 + level
        return buildPreview(
            `(${body} × 0.7) + ${level} = ${raw.toFixed(1)}`,
            raw,
            'physical'
        )
    },
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
    previewDamage: (hero: Hero) => {
        const body = hero.baseStats.body.value
        const level = hero.level
        const raw = (body * 0.7 + level * 0.5) * 0.8
        return buildPreview(
            `((${body} × 0.7) + ${level} × 0.5) × 0.8 = ${raw.toFixed(1)}`,
            raw,
            'physical'
        )
    },
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
    previewDamage: (hero: Hero) => {
        const body = hero.baseStats.body.value
        const level = hero.level
        const raw = (body * 0.7 + level * 0.5) * 1.5
        return buildPreview(
            `((${body} × 0.7) + ${level} × 0.5) × 1.5 = ${raw.toFixed(1)}`,
            raw,
            'physical'
        )
    },
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
    previewDamage: (hero: Hero) => {
        const mind = hero.baseStats.mind.value
        const raw = mind * 2.5
        return buildPreview(
            `${mind} × 2.5 = ${raw.toFixed(1)}`,
            raw,
            'fire'
        )
    },
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
    previewDamage: (hero: Hero) => {
        const body = hero.baseStats.body.value
        const level = hero.level
        const raw = body * 1.2 + level * 0.5
        return buildPreview(
            `(${body} × 1.2) + ${level} × 0.5 = ${raw.toFixed(1)}  → aplica "Lesionado"`,
            raw,
            'physical'
        )
    },
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
    previewDamage: (hero: Hero) => {
        const body = hero.baseStats.body.value
        const level = hero.level
        const raw = body * 1.5 + level * 3
        return buildPreview(
            `(${body} × 1.5) + (${level} × 3) = ${raw.toFixed(1)}  → golpea a todos`,
            raw,
            'physical'
        )
    },
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
        const beforeHeal = caster.health
        caster.heal(healAmount)
        const restored = caster.health - beforeHeal
        if (restored > 0) context.showPlayerHit(restored, { heroId: caster.id, variant: 'heal' })

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
    previewDamage: (hero: Hero) => {
        const mind = hero.baseStats.mind.value
        const raw = mind * 2.6
        const splash = raw * 0.6
        return buildPreview(
            `${mind} × 2.6 = ${raw.toFixed(1)}  (salta a 1-2 enemigos con ${splash.toFixed(1)})`,
            raw,
            'holy'
        )
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
    previewDamage: (hero: Hero) => {
        const mind = hero.baseStats.mind.value
        const raw = mind * 4
        return buildPreview(
            `${mind} × 4 = ${raw.toFixed(1)}`,
            raw,
            'holy'
        )
    },
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
        if (restored > 0) context.showPlayerHit(restored, { heroId: target.id, variant: 'heal' })

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
