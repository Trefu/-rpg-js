import { Enemy } from '../../Enemy'
import type { AbilityContext, IAbility } from '../../../interfaces/IAbility'
import type { IEnemy } from '../../../interfaces/ICharacter'
import { StatusEffects } from '../../../StatusEffects'
import { computeRawDamage, damageStep } from '../../../abilities/damagePipeline'
import { registerAbility } from '../../../abilities/registry'
import sprite from '@/assets/sprites/enemies/spectre.png'
import curseIcon from '@/assets/icons/cursed-star.png'

const wait = (ctx: AbilityContext) => new Promise(resolve => setTimeout(resolve, ctx.animationDelay))
const livingTargets = (ctx: AbilityContext) => (ctx.opponents ?? (ctx.target ? [ctx.target] : [])).filter(hero => hero.isAlive)

export const SpectralSentence: IAbility = {
  name: 'Sentencia espectral', type: 'spectralSentence',
  description: 'Marca a todos los héroes vivos: morirán al comenzar su tercer turno marcado. Puede disiparse.',
  cooldown: 3, targetType: 'enemies-only', requiresTarget: false, tags: ['debuff'], icon: curseIcon,
  execute: async ctx => {
    for (const hero of livingTargets(ctx)) {
      // Recasting cannot postpone an existing countdown.
      if (!hero.hasStatusEffect('death_sentence')) hero.addStatusEffect({ ...StatusEffects.DEATH_SENTENCE })
      ctx.playHeroVfx?.(hero.id, { asset: 'holy-light', durationMs: 1200 })
      const remaining = hero.statusEffects.find(effect => effect.type === 'death_sentence')!.turns
      ctx.log(`${hero.name}: Sentencia de muerte. Morirá en ${remaining} turnos si no se disipa.`)
    }
    ctx.showAnnouncement('Sentencia de muerte · 3 turnos', 'status', 1500)
    await wait(ctx)
  }
}

export const SpectralFog: IAbility = {
  name: 'Niebla espectral', type: 'spectralFog', description: 'Aplica Nublado a todos los héroes vivos.',
  cooldown: 2, targetType: 'enemies-only', requiresTarget: false, tags: ['debuff'], icon: curseIcon,
  execute: async ctx => {
    for (const hero of livingTargets(ctx)) {
      hero.addStatusEffect({ ...StatusEffects.CLOUDED })
      ctx.onStatusApplied?.(StatusEffects.CLOUDED)
      ctx.playHeroVfx?.(hero.id, { asset: 'poison-bomb', durationMs: 900 })
      ctx.log(`${hero.name} recibe Nublado.`)
    }
    await wait(ctx)
  }
}

function spectralAffliction(name: string, type: string, coefficient: number): IAbility {
  const pipeline = damageStep({ stat: 'mind', coef: coefficient, levelCoef: 1 })
  return {
    name, type, description: 'Inflige daño arcano según MEN y nivel. Aplica Lesión y, a la vez, Quemadura, Veneno y Congelación (cargas según MEN).',
    cooldown: 0, targetType: 'enemies-only', requiresTarget: true, tags: ['debuff'], icon: curseIcon, damageType: 'arcane',
    execute: async ctx => {
      const target = ctx.target
      if (target?.isAlive) {
        const caster = ctx.caster as IEnemy
        const damage = Math.max(1, Math.floor(computeRawDamage(pipeline, caster)))
        const stacks = Math.max(1, Math.floor(caster.baseStats.mind.value / 15))
        const before = target.health
        target.takeDamage(damage, { damageType: 'arcane' })
        ctx.showPlayerHit(before - target.health, { heroId: target.id })
        if (target.isAlive) {
          target.addStatusEffect({ ...StatusEffects.INJURED })
          for (const dot of [StatusEffects.BURN, StatusEffects.POISON, StatusEffects.FREEZE]) {
            target.addStatusEffect({ ...dot, stacks })
          }
        }
        ctx.playHeroVfx?.(target.id, { asset: 'poison-bomb', durationMs: 900 })
        ctx.log(`${name}: ${target.name} recibe ${before - target.health} de daño arcano, Lesión y ${stacks} cargas de Quemadura, Veneno y Congelación.`)
      }
      await wait(ctx)
    }
  }
}

export const SpectralTouch = spectralAffliction('Toque de la ruina', 'spectralTouch', 0.45)
export const SpectralRend = spectralAffliction('Desgarro espectral', 'spectralRend', 0.65)
for (const ability of [SpectralSentence, SpectralFog, SpectralTouch, SpectralRend]) registerAbility(ability)

/** Only instantiated by mountain-peak's map-assigned spectral event, never a random patrol. */
export class Spectre extends Enemy {
  readonly sprite = sprite
  readonly enemyGroup = 'skeletons' as const
  private actionIndex = 0
  constructor(level = 3) {
    super({ id: `mountain-spectre-${Math.random().toString(36).slice(2, 10)}`, name: 'Espectro del paso', level,
      maxHealth: 120 + (level - 1) * 25, experienceReward: 100, goldReward: { min: 60, max: 80 }, critChance: 0,
      baseStats: { mind: { value: 30, growthPerLevel: 1.5 }, agility: { value: 9, growthPerLevel: 0.35 } } })
    this.attackPatterns = [SpectralSentence, SpectralFog, SpectralTouch, SpectralRend]
  }
  get intention() { return this.attackPatterns[this.actionIndex].name }
  override selectAttackPattern() {
    const action = this.attackPatterns[this.actionIndex]
    this.actionIndex = (this.actionIndex + 1) % this.attackPatterns.length
    return action
  }
}
