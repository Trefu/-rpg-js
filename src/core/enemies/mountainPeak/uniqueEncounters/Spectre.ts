import { Enemy } from '../../Enemy'
import type { AbilityContext, IAbility } from '../../../interfaces/IAbility'
import type { ICharacter, IEnemy } from '../../../interfaces/ICharacter'
import { StatusEffects } from '../../../StatusEffects'
import { computeRawDamage, damageStep } from '../../../abilities/damagePipeline'
import { registerAbility } from '../../../abilities/registry'
import sprite from '@/assets/sprites/enemies/mountain-peak/spectre.png'
import curseIcon from '@/assets/icons/cursed-star.png'

const wait = (ctx: AbilityContext) => new Promise(resolve => setTimeout(resolve, ctx.animationDelay))
const livingTargets = (ctx: AbilityContext) => (ctx.opponents ?? (ctx.target ? [ctx.target] : [])).filter(hero => hero.isAlive)

export const SpectralSentence: IAbility = {
  name: 'Sentencia espectral', type: 'spectralSentence',
  description: 'Marca a un héroe: morirá al comenzar su tercer turno marcado. Puede disiparse. No puede marcar a otro hasta que el elegido muera.',
  cooldown: 3, targetType: 'enemies-only', requiresTarget: true, tags: ['debuff'], icon: curseIcon,
  execute: async ctx => {
    const spectre = ctx.caster as Spectre
    // Keep the lock even if the mark is dispelled: only death releases it.
    if (spectre.sentencedHero?.isAlive) {
      ctx.log(`${spectre.name} sigue acechando a ${spectre.sentencedHero.name}.`)
      await wait(ctx)
      return
    }
    const targets = livingTargets(ctx)
    const hero = targets.find(hero => hero.id === ctx.target?.id) ?? targets[0]
    if (hero) {
      spectre.sentencedHero = hero
      hero.addStatusEffect({ ...StatusEffects.DEATH_SENTENCE })
      ctx.playHeroVfx?.(hero.id, { asset: 'holy-light', durationMs: 1200 })
      const remaining = hero.statusEffects.find(effect => effect.type === 'death_sentence')!.turns
      ctx.log(`${hero.name}: Sentencia de muerte. Morirá en ${remaining} turnos si no se disipa.`)
      ctx.showAnnouncement(`${hero.name} · Sentencia de muerte · 3 turnos`, 'status', 1500)
    }
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
        // `takeDamage` devuelve el desglose HP/absorbido: si un escudo come
        // el golpe entero, el floater es "◇N Escudo" (azul) y el popup de
        // daño solo aparece con el daño que realmente llegó a HP.
        const applied = target.takeDamage(damage, { damageType: 'arcane' })
        if (applied.hpDamage > 0) ctx.showPlayerHit(applied.hpDamage, { heroId: target.id })
        if (applied.absorbed > 0) ctx.showPlayerHit(applied.absorbed, { heroId: target.id, variant: 'shield' })
        const absorbNote = applied.absorbed > 0 ? ` (${applied.absorbed} absorbido por escudo)` : ''
        if (target.isAlive) {
          target.addStatusEffect({ ...StatusEffects.INJURED })
          for (const dot of [StatusEffects.BURN, StatusEffects.POISON, StatusEffects.FREEZE]) {
            target.addStatusEffect({ ...dot, stacks })
          }
        }
        ctx.playHeroVfx?.(target.id, { asset: 'poison-bomb', durationMs: 900 })
        ctx.log(`${name}: ${target.name} recibe ${applied.hpDamage + applied.absorbed} de daño arcano${absorbNote}, Lesión y ${stacks} cargas de Quemadura, Veneno y Congelación.`)
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
  readonly combatMusic = 'spectre' as const
  readonly sprite = sprite
  readonly enemyGroup = 'skeletons' as const
  public sentencedHero: ICharacter | null = null
  private actionIndex = 0
  // Testing buff: doubled stats and level 6. Halve these values when restoring the 10% haunt chance.
  constructor(level = 6) {
    super({ id: `mountain-spectre-${Math.random().toString(36).slice(2, 10)}`, name: 'Espectro del paso', level,
      maxHealth: 240 + (level - 1) * 64, experienceReward: 200, goldReward: { min: 120, max: 160 }, critChance: 0,
      baseStats: { mind: { value: 60, growthPerLevel: 4 }, agility: { value: 18, growthPerLevel: 1 } } })
    this.attackPatterns = [SpectralSentence, SpectralFog, SpectralTouch, SpectralRend]
  }
  private skipLockedSentence() {
    if (this.sentencedHero?.isAlive && this.attackPatterns[this.actionIndex] === SpectralSentence) {
      this.actionIndex = (this.actionIndex + 1) % this.attackPatterns.length
    }
  }
  get intention() {
    const index = this.sentencedHero?.isAlive && this.attackPatterns[this.actionIndex] === SpectralSentence
      ? (this.actionIndex + 1) % this.attackPatterns.length : this.actionIndex
    return this.attackPatterns[index].name
  }
  override selectAttackPattern() {
    this.skipLockedSentence()
    const action = this.attackPatterns[this.actionIndex]
    this.actionIndex = (this.actionIndex + 1) % this.attackPatterns.length
    return action
  }
}
