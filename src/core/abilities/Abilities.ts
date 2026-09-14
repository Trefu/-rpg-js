import type { IAbility, AbilityContext, VfxEffect } from '@/core/interfaces/IAbility'
import type { Hero } from '../Hero'
import { StatusEffects, DOT_STATUS_TYPES } from '../StatusEffects'
import {
  computeRawDamage,
  dealDamage,
  damageStep,
  previewFromPipeline,
  type DamageStep
} from './damagePipeline'
import { registerAbility } from './registry'

/**
 * Re-export para retro-compatibilidad con imports legacy (`Enemy.ts`,
 * `useCombat.ts` antes del refactor). El home del helper es
 * `damagePipeline.ts`; nuevos usos deben importar desde ahí.
 */
export { applyDamageVariance, DAMAGE_VARIANCE_MIN, DAMAGE_VARIANCE_MAX } from './damagePipeline'

import sabersChoc from '@/assets/icons/sabers-choc.png'
import swordSlice from '@/assets/icons/sword-slice.png'
import thunderBlade from '@/assets/icons/thunder-blade.png'
import heartDrop from '@/assets/icons/heart-drop.png'
import stunGrenade from '@/assets/icons/stun-grenade.png'
import thrownKnife from '@/assets/icons/thrown-knife.png'
import smallFire from '@/assets/icons/small-fire.png'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const BASIC_ATTACK_HITS_LEVEL_STEP = 4
const BASIC_ATTACK_HIT_INTERVAL_MS = 200
const BASIC_ATTACK_DURATION_MS = 800
const DEFAULT_ANIMATION_DELAY_MS = 1500

export function getBasicAttackHitCount(level: number): number {
  return Math.max(1, Math.floor(Math.max(1, level) / BASIC_ATTACK_HITS_LEVEL_STEP) + 1)
}

const SECOND_WIND_HEAL_PCT = 0.20
const SECOND_WIND_ENERGY_RESTORE_PCT = 0.10
const SECOND_WIND_CHARGES = 3

/**
 * Helpers internos de presentation/UI (VFX por tipo, rotacion aleatoria).
 * NO son parte del DSL de damage (esos viven en `damagePipeline.ts`).
 */
const BASIC_ATTACK_ROTATION_DEG = 90
const randBetween = (min: number, max: number): number => min + Math.random() * (max - min)

const VFX_POOL_BY_DAMAGE_TYPE: Record<string, VfxEffect[]> = {
  physical: [
    { asset: 'physical-slash-1', durationMs: 1200 },
    { asset: 'physical-slash-2', durationMs: 1200 },
    { asset: 'physical-slash-3', durationMs: 1200 }
  ],
  holy: [
    { asset: 'holy-slash-down', durationMs: 1200 },
    { asset: 'holy-slash-up', durationMs: 1200 }
  ],
  fire: [
    { asset: 'fire-slash-down', durationMs: 1200 },
    { asset: 'fire-slash-up', durationMs: 1200 }
  ]
}

const getBasicAttackHitVfx = (ability: IAbility | undefined): VfxEffect[] => {
  const declared = ability?.hitVfx ?? ability?.vfx
  if (Array.isArray(declared)) return declared
  if (declared) return [declared]
  const pool = VFX_POOL_BY_DAMAGE_TYPE[ability?.damageType ?? 'physical']
  return pool ?? VFX_POOL_BY_DAMAGE_TYPE.physical
}

const resolveVfxForHit = (hitIndex: number, vfx: VfxEffect | VfxEffect[] | undefined): VfxEffect | undefined => {
  if (!vfx) return undefined
  const pick = (effect: VfxEffect): VfxEffect => ({
    ...effect,
    rotationDeg: randBetween(-BASIC_ATTACK_ROTATION_DEG, BASIC_ATTACK_ROTATION_DEG)
  })
  if (Array.isArray(vfx)) {
    if (vfx.length === 0) return undefined
    return pick(vfx[hitIndex % vfx.length])
  }
  return pick(vfx)
}

const executeBasicAttack = async (context: AbilityContext) => {
  const caster = context.caster as Hero
  const target = context.target
  if (!target || !target.isAlive) return

  const ability = context.ability
  const levelBasedHitCount = getBasicAttackHitCount(caster.level)
  const hitCount = Math.max(levelBasedHitCount, ability?.hitCount ?? levelBasedHitCount)
  const hitIntervalMs = hitCount > 1
    ? Math.max(0, ability?.hitIntervalMs ?? BASIC_ATTACK_HIT_INTERVAL_MS)
    : 0
  const hitVfxList = getBasicAttackHitVfx(ability)
  const pipeline = ability?.pipeline as DamageStep

  for (let hitIndex = 0; hitIndex < hitCount; hitIndex++) {
    if (!target.isAlive) break

    const rawDamage = pipeline ? computeRawDamage(pipeline, caster) : caster.baseStats.body.value * 0.7 + caster.level
    const { finalDamage } = dealDamage({
      caster,
      target,
      ability: ability!,
      rawDamage,
      effects: context
    })

    if (finalDamage > 0) {
      const hitVfx = resolveVfxForHit(hitIndex, hitVfxList)
      if (hitVfx) context.playEnemyVfx?.(target.id, hitVfx)
    }

    if (typeof caster.restoreEnergy === 'function') {
      const restored = caster.restoreEnergy(5)
      if (restored > 0) context.log(`+${restored} de energía.`)
    }

    await sleep(context.animationDelay)
    if (hitIndex < hitCount - 1 && hitIntervalMs > 0) await sleep(hitIntervalMs)
  }
}

export const BasicAttack: IAbility = {
  name: 'Ataque Básico',
  description: 'Un ataque simple con daño bajo',
  type: 'attack',
  cooldown: 0,
  damageType: 'physical',
  targetType: 'enemies-only',
  tags: ['physical', 'damage'],
  icon: sabersChoc,
  animationDurationMs: BASIC_ATTACK_DURATION_MS,
  pipeline: damageStep({ stat: 'body', coef: 0.7, levelCoef: 1, statLabel: 'CUE' }),
  previewDamage: previewFromPipeline(
    damageStep({ stat: 'body', coef: 0.7, levelCoef: 1, statLabel: 'CUE' }),
    'physical'
  ),
  execute: executeBasicAttack
}
registerAbility(BasicAttack)

export const WarriorBasicAttack: IAbility = {
  ...BasicAttack,
  type: 'warriorAttack',
  tags: ['warrior', 'physical', 'damage'],
  previewDamage: previewFromPipeline(
    damageStep({ stat: 'body', coef: 0.7, levelCoef: 1, statLabel: 'CUE' }),
    'physical'
  )
}
registerAbility(WarriorBasicAttack)

export const ClericBasicAttack: IAbility = {
  name: 'Ataque Sagrado',
  description: 'Destello radiante que inflige daño sagrado al objetivo.',
  type: 'clericAttack',
  cooldown: 0,
  damageType: 'holy',
  targetType: 'enemies-only',
  tags: ['cleric', 'holy', 'damage'],
  icon: sabersChoc,
  animationDurationMs: BASIC_ATTACK_DURATION_MS,
  pipeline: damageStep({ stat: 'body', coef: 0.7, levelCoef: 1, statLabel: 'CUE' }),
  previewDamage: previewFromPipeline(
    damageStep({ stat: 'body', coef: 0.7, levelCoef: 1, statLabel: 'CUE' }),
    'holy'
  ),
  execute: executeBasicAttack
}
registerAbility(ClericBasicAttack)

export const StunStrike: IAbility = {
  name: 'Golpe Aturdidor',
  description: 'Un golpe que puede aturdir al enemigo',
  type: 'stunStrike',
  cooldown: 3,
  energyCost: 15,
  damageType: 'physical',
  targetType: 'enemies-only',
  tags: ['physical', 'damage'],
  icon: stunGrenade,
  pipeline: damageStep({ stat: 'body', coef: 0.7, levelCoef: 0.5, multiplier: 0.8, statLabel: 'CUE' }),
  previewDamage: previewFromPipeline(
    damageStep({ stat: 'body', coef: 0.7, levelCoef: 0.5, multiplier: 0.8, statLabel: 'CUE' }),
    'physical'
  ),
  execute: async (context: AbilityContext) => {
    const caster = context.caster as Hero
    const target = context.target
    if (!target || !target.isAlive) return
    const rawDamage = computeRawDamage(context.ability.pipeline as DamageStep, caster)
    dealDamage({ caster, target, ability: context.ability, rawDamage, effects: context })
    await sleep(context.animationDelay)
  }
}
registerAbility(StunStrike)

export const StealthStrike: IAbility = {
  name: 'Golpe Sigiloso',
  description: 'Ataque furtivo que hace más daño',
  type: 'stealthStrike',
  cooldown: 2,
  energyCost: 15,
  damageType: 'physical',
  targetType: 'enemies-only',
  tags: ['physical', 'damage'],
  icon: thrownKnife,
  pipeline: damageStep({ stat: 'body', coef: 0.7, levelCoef: 0.5, multiplier: 1.5, statLabel: 'CUE' }),
  previewDamage: previewFromPipeline(
    damageStep({ stat: 'body', coef: 0.7, levelCoef: 0.5, multiplier: 1.5, statLabel: 'CUE' }),
    'physical'
  ),
  execute: async (context: AbilityContext) => {
    const caster = context.caster as Hero
    const target = context.target
    if (!target || !target.isAlive) return
    const rawDamage = computeRawDamage(context.ability.pipeline as DamageStep, caster)
    dealDamage({ caster, target, ability: context.ability, rawDamage, effects: context })
    await sleep(context.animationDelay)
  }
}
registerAbility(StealthStrike)

export const Fireball: IAbility = {
  name: 'Bola de Fuego',
  description: 'Hechizo de fuego que causa daño mágico',
  type: 'fireball',
  cooldown: 3,
  energyCost: 25,
  damageType: 'fire',
  targetType: 'enemies-only',
  tags: ['fire', 'damage'],
  icon: smallFire,
  pipeline: damageStep({ stat: 'mind', coef: 2.0, levelCoef: 1.5, statLabel: 'MEN' }),
  previewDamage: previewFromPipeline(
    damageStep({ stat: 'mind', coef: 2.0, levelCoef: 1.5, statLabel: 'MEN' }),
    'fire'
  ),
  execute: async (context: AbilityContext) => {
    const caster = context.caster as Hero
    const target = context.target
    if (!target || !target.isAlive) return
    const rawDamage = computeRawDamage(context.ability.pipeline as DamageStep, caster)
    dealDamage({ caster, target, ability: context.ability, rawDamage, effects: context })
    await sleep(context.animationDelay)
  }
}
registerAbility(Fireball)

export const WarriorInjuringStrike: IAbility = {
  name: 'Golpe Lesionador',
  description: 'Un tajo vertical preciso que inflige daño y aplica el debufo "Lesionado" al objetivo durante 1 turno.',
  type: 'warriorInjuringStrike',
  cooldown: 0,
  energyCost: 20,
  damageType: 'physical',
  targetType: 'enemies-only',
  tags: ['warrior', 'physical', 'damage'],
  icon: swordSlice,
  animationDurationMs: 800,
  pipeline: damageStep({ stat: 'body', coef: 1.2, levelCoef: 0.5, statLabel: 'CUE' }),
  previewDamage: previewFromPipeline(
    damageStep({ stat: 'body', coef: 1.2, levelCoef: 0.5, statLabel: 'CUE' }),
    'physical'
  ),
  execute: async (context: AbilityContext) => {
    const caster = context.caster as Hero
    const target = context.target as any

    const rawDamage = computeRawDamage(context.ability.pipeline as DamageStep, caster)
    dealDamage({ caster, target, ability: context.ability, rawDamage, effects: context })

    if (target && typeof target.addStatusEffect === 'function' && target.isAlive) {
      const template = StatusEffects.INJURED
      const warriorInjuringStrikeExtraInjuredTurns = 1
      const baseTurns = template.turns + warriorInjuringStrikeExtraInjuredTurns
      const turns = baseTurns + Math.floor((caster.level - 1) / 2)
      target.addStatusEffect({ ...template, turns })
      context.log(`¡${target.name} ha sido Lesionado${turns > 1 ? ' durante ' + turns + ' turnos' : ''}!`)
      context.showAnnouncement(`¡Lesionado${turns > 1 ? ' x' + turns : ''}!`, 'status', 1500)
    }

    await sleep(context.animationDelay)
  }
}
registerAbility(WarriorInjuringStrike)

export const WarriorDevastatingStrike: IAbility = {
  name: 'Golpe Devastador',
  description: 'Un golpe devastador que golpea a todos los enemigos con el mismo daño.',
  type: 'warriorDevastatingStrike',
  cooldown: 0,
  energyCost: 35,
  damageType: 'physical',
  targetType: 'enemies-only',
  tags: ['warrior', 'physical', 'damage', 'aoe'],
  icon: thunderBlade,
  requiresTarget: false,
  aoe: true,
  pipeline: damageStep({ stat: 'body', coef: 1.5, levelCoef: 3, statLabel: 'CUE' }),
  previewDamage: previewFromPipeline(
    damageStep({ stat: 'body', coef: 1.5, levelCoef: 3, statLabel: 'CUE' }),
    'physical'
  ),
  execute: async (context: AbilityContext) => {
    const caster = context.caster as Hero
    const rawDamage = computeRawDamage(context.ability.pipeline as DamageStep, caster)
    const { finalDamage, crit } = dealDamage({ caster, target: context.target ?? caster, ability: context.ability, rawDamage, effects: context })
    context.lastPrimaryFinalDamage = finalDamage
    if (crit.isCrit) {
      const dmgType = context.ability?.damageType
      const { getDamageTypeLabel } = await import('../combat/damageTypes')
      const typeLabel = dmgType ? getDamageTypeLabel(dmgType) : 'Físico'
      const prefix = crit.isOvercrit ? '¡Overcrit!' : 'Crítico'
      context.showAnnouncement(`${prefix} ${finalDamage} ${typeLabel}`, 'crit', 1800, { priority: 100, interrupt: true })
    }
  }
}
registerAbility(WarriorDevastatingStrike)

export const SecondWind: IAbility = {
  name: 'Segundo Aliento',
  description: `Cura ${Math.round(SECOND_WIND_HEAL_PCT * 100)}% de vida maxima y aplica el buff Segundo Aliento: cada bloqueo siguiente restaura ${Math.round(SECOND_WIND_ENERGY_RESTORE_PCT * 100)}% de la energia maxima (${SECOND_WIND_CHARGES} bloqueos). Mientras tengas cargas activas, los enemigos te priorizaran mucho mas como objetivo (mayor agro).`,
  type: 'secondWind',
  cooldown: 2,
  energyCost: 0,
  targetType: 'allies-only',
  tags: ['buff', 'heal'],
  icon: heartDrop,
  requiresTarget: false,
  animationDurationMs: 1200,
  customSound: '/assets/sounds/Buffs_Heals_SFX/Def_buff.wav',
  execute: async (context: AbilityContext) => {
    const caster = context.caster as Hero
    if (!caster.isAlive) {
      context.log('No puedes usar Segundo Aliento estando inconsciente.')
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

    context.log(`Usaste Segundo Aliento: cura ${healAmount} HP y activa el buff (${maxCharges} cargas).`)
    context.showAnnouncement('Segundo Aliento!', 'info', 1500)
    context.audioManager.playCustomSound('/assets/sounds/Buffs_Heals_SFX/Def_buff.wav')
    await sleep(context.animationDelay)
  }
}
registerAbility(SecondWind)

export const ClericRadiantStrike: IAbility = {
  name: 'Luz Sagrada',
  description: 'Un destello radiante que causa daño sagrado al objetivo y puede saltar a 1-2 enemigos adicionales cercanos.',
  type: 'clericRadiantStrike',
  cooldown: 0,
  energyCost: 30,
  damageType: 'holy',
  targetType: 'enemies-only',
  tags: ['cleric', 'holy', 'damage'],
  icon: smallFire,
  randomAttack: {
    minExtraTargets: 1,
    maxExtraTargets: 2,
    damageMultiplier: 0.6
  },
  pipeline: damageStep({ stat: 'mind', coef: 2.4, levelCoef: 1.2, statLabel: 'MEN' }),
  previewDamage: previewFromPipeline(
    damageStep({ stat: 'mind', coef: 2.4, levelCoef: 1.2, statLabel: 'MEN' }),
    'holy'
  ),
  execute: async (context: AbilityContext) => {
    const caster = context.caster as Hero
    const target = context.target
    if (!target || !target.isAlive) return
    const baseDamage = computeRawDamage(context.ability.pipeline as DamageStep, caster)
    const { finalDamage } = dealDamage({ caster, target, ability: context.ability, rawDamage: baseDamage, effects: context })
    context.lastPrimaryBaseDamage = baseDamage
    void finalDamage
    await sleep(context.animationDelay)
  }
}
registerAbility(ClericRadiantStrike)

export const ClericDivineSmite: IAbility = {
  name: 'Castigo Divino',
  description: 'Un ataque radiante imbuido de fe pura.',
  type: 'clericDivineSmite',
  cooldown: 0,
  energyCost: 40,
  damageType: 'holy',
  targetType: 'enemies-only',
  tags: ['cleric', 'holy', 'damage'],
  icon: thunderBlade,
  pipeline: damageStep({ stat: 'mind', coef: 3.0, levelCoef: 2.5, statLabel: 'MEN' }),
  previewDamage: previewFromPipeline(
    damageStep({ stat: 'mind', coef: 3.0, levelCoef: 2.5, statLabel: 'MEN' }),
    'holy'
  ),
  execute: async (context: AbilityContext) => {
    const caster = context.caster as Hero
    const target = context.target
    if (!target || !target.isAlive) return
    const rawDamage = computeRawDamage(context.ability.pipeline as DamageStep, caster)
    dealDamage({ caster, target, ability: context.ability, rawDamage, effects: context })
    await sleep(context.animationDelay)
  }
}
registerAbility(ClericDivineSmite)

export const ClericHeal: IAbility = {
  name: 'Curar Heridas',
  description: 'Canaliza luz radiante para restaurar 30% (+ bono por mente y nivel) de la vida maxima de un aliado (incluido el caster) y eliminar todos los efectos de dano por tiempo (Quemadura, Veneno, Congelado).',
  type: 'clericHeal',
  cooldown: 0,
  energyCost: 30,
  targetType: 'allies-only',
  tags: ['cleric', 'heal'],
  icon: heartDrop,
  execute: async (context: AbilityContext) => {
    const caster = context.caster as Hero
    const target = context.target as Hero
    if (!target || !target.isAlive) {
      context.log('No hay un aliado valido para curar.')
      return
    }
    const healAmount = Math.floor(
      target.maxHealth * 0.30
      + caster.baseStats.mind.value * 2
      + caster.level * 2
    )
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
    context.log(parts.length > 0 ? `${parts.join(' ')}.` : `La luz radiante no tuvo efecto sobre ${target.name}.`)
    context.showAnnouncement('Curar Heridas', 'info', 1500)
    await sleep(context.animationDelay)
  }
}
registerAbility(ClericHeal)

export { DEFAULT_ANIMATION_DELAY_MS }
