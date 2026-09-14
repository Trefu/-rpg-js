import type { ICharacter, IPlayerStats, IEnemyStats } from '../interfaces/ICharacter'
import type { Hero } from '../Hero'
import type { CritResult } from '../crit'
import { getOutgoingDamageMultiplier } from '../combat/damageModifiers'
import { getDamageTypeLabel, getDamageTypeInfo, type DamageTypeId } from '../combat/damageTypes'
import type { IAbility, AbilityDamagePreview, DamageType } from '../interfaces/IAbility'
import type { AbilityEffects } from '../interfaces/IAbility'

/**
 * Caster valido para `dealDamage`: cualquier combatiente con `baseStats`,
 * `level`, `statusEffects` y `rollCrit`. Tanto `Hero` como `Enemy` lo cumplen
 * estructuralmente (no usamos sus métodos específicos de clase).
 */
type StatBearer = {
  level: number
  baseStats: IPlayerStats | IEnemyStats
}

/**
 * Caster para el pipeline de daño: `StatBearer` + `statusEffects` (buffs/debuffs)
 * + `rollCrit` (cualquier combatiente con crit chance).
 */
export type DamageCaster = StatBearer & {
  statusEffects: import('../interfaces/IStatusEffect').IStatusEffect[]
  rollCrit(): CritResult
}

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

const computeDamageRange = (raw: number, range: DamageVarianceRange = DEFAULT_VARIANCE_RANGE): { min: number, max: number } => {
  if (raw <= 0) return { min: 0, max: 0 }
  const lo = Math.min(range.min, range.max)
  const hi = Math.max(range.min, range.max)
  return {
    min: Math.max(0, Math.floor(raw * lo)),
    max: Math.max(0, Math.floor(raw * hi))
  }
}

/**
 * Step de daño: `stat.value * coef + level * levelCoef`, opcionalmente
 * multiplicado por `multiplier`. Un pipeline es uno o varios steps sumados.
 *
 * Ejemplo: `damageStep({stat:'body', coef:0.7, levelCoef:1, statLabel:'CUE'})`
 *  → para un caster con body=14, level=3, raw = 14*0.7 + 3*1 = 12.8
 */
export interface DamageStep {
  stat: 'body' | 'mind'
  coef: number
  levelCoef: number
  /** Multiplicador global aplicado al resultado del step (ej: 1.5 para StealthStrike). */
  multiplier?: number
  /** Label corto del stat en la fórmula formateada: 'CUE' (cuerpo) o 'MEN' (mente). */
  statLabel?: 'CUE' | 'MEN'
}

export function damageStep(s: DamageStep): DamageStep { return s }

/**
 * Calcula el daño raw (sin varianza) de un pipeline para un caster.
 * Cada step contribuye `stat.value * coef + level * levelCoef` (multiplicado
 * por `multiplier` si está); se suman entre sí.
 */
export function computeRawDamage(pipeline: DamageStep | DamageStep[], caster: StatBearer): number {
  const steps = Array.isArray(pipeline) ? pipeline : [pipeline]
  let total = 0
  for (const step of steps) {
    const statValue = caster.baseStats[step.stat].value
    const base = statValue * step.coef + caster.level * step.levelCoef
    const mult = step.multiplier ?? 1
    total += base * mult
  }
  return total
}

/**
 * Reproduce el SFX de la ability: si la ability define `customSound`,
 * se reproduce ese (pasado al `playCustomSound` del AudioManager);
 * si no, se usa el fallback generico `playAttackSound`.
 */
const playAbilitySfx = (
  audioManager: AbilityEffects['audioManager'],
  ability: IAbility | undefined
): void => {
  const custom = ability?.customSound
  if (custom) audioManager.playCustomSound(custom)
  else audioManager.playAttackSound()
}

/**
 * Helpers de coloreo para las fórmulas de daño del modal de abilities.
 * Espejo de `T` en HeroStatChips.vue: cada label/valor va envuelto en un
 * `<span class="hint-XXX">` con el color del stat correspondiente
 * (Cuerpo→orange, Mente→azul, nivel→gold, ATQ→orange, ATQ MAG→azul, etc.).
 *
 * Los colores se aplican via `.ability-formula .hint-XXX`,
 * `.mab-info-formula .hint-XXX` y `.pregame-ability-formula .hint-XXX`
 * en `hint-colors.css` (estilos globales porque el contenido va por v-html).
 *
 * `dmgType()` envuelve el nombre del tipo de daño (ej. "Fuego") en su
 * clase de color (`hint-fire`, `hint-holy`, etc.) para que el ojo
 * identifique al instante de dónde viene el daño. Misma paleta que
 * los badges `.dmg-*` definidos en `damageTypes.ts`.
 *
 * Los inputs son números/strings calculados a partir de stats del caster
 * (no user input), así que v-html es seguro.
 */
export const F = {
  base: (s: string | number) => `<span class="hint-base">${s}</span>`,
  lvl:  (s: string | number) => `<span class="hint-lvl">${s}</span>`,
  cue:  (s: string | number) => `<span class="hint-cue">${s}</span>`,
  mind: (s: string | number) => `<span class="hint-mind">${s}</span>`,
  agi:  (s: string | number) => `<span class="hint-agi">${s}</span>`,
  con:  (s: string | number) => `<span class="hint-con">${s}</span>`,
  atk:  (s: string | number) => `<span class="hint-atk">${s}</span>`,
  mag:  (s: string | number) => `<span class="hint-mag">${s}</span>`,
  dmgType: (id: DamageTypeId | string) => {
    const info = getDamageTypeInfo(id)
    const cls = info?.className ?? 'hint-base'
    const label = info?.label ?? id
    return `<span class="${cls}">${label}</span>`
  }
}

/**
 * Helper para componer el sufijo de fórmula `→ <Tipo>`. Centraliza el
 * `F.base('→ ')` + tipo coloreado para que todas las formulas usen el
 * mismo separador y la misma paleta de color por tipo.
 */
export const dmgSuffix = (id: DamageTypeId | string, extra?: string): string => {
  const arrow = F.base('→')
  const tag = F.dmgType(id)
  return extra ? `${arrow} ${tag} ${F.base('· ' + extra)}` : `${arrow} ${tag}`
}

/**
 * Genera la fórmula HTML coloreada a partir del pipeline + caster. Usada
 * por `previewFromPipeline` para derivar el previewDamage automáticamente.
 */
export function describePipeline(pipeline: DamageStep | DamageStep[], caster: StatBearer): string {
  const steps = Array.isArray(pipeline) ? pipeline : [pipeline]
  const parts: string[] = []
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    const statValue = caster.baseStats[step.stat].value
    const statLabelText = step.statLabel ?? (step.stat === 'body' ? 'CUE' : 'MEN')
    const statColor = step.stat === 'body' ? F.cue : F.mind
    const level = caster.level
    const baseValue = statValue * step.coef + level * step.levelCoef
    const statName = statColor(statLabelText)
    const statVal = statColor(Math.round(statValue))
    const lvlName = F.lvl('nivel')
    const lvlVal = F.lvl(level)
    let expr: string
    if (step.coef !== 0 && step.levelCoef !== 0) {
      expr = `(${statName} ${statVal} × ${step.coef} + ${lvlName} ${lvlVal} × ${step.levelCoef})`
    } else if (step.coef !== 0) {
      expr = `${statName} ${statVal} × ${step.coef}`
    } else {
      expr = `${lvlName} ${lvlVal} × ${step.levelCoef}`
    }
    if (step.multiplier !== undefined && step.multiplier !== 1) {
      expr = `(${expr}) × ${step.multiplier}`
    }
    parts.push(`${expr} = ${F.atk(baseValue.toFixed(1))}`)
  }
  return parts.join(' + ')
}

/**
 * Helper para construir el previewDamage de una ability. Centraliza la
 * generación del rango y la metadata para que cada ability solo pase
 * su fórmula con los valores del caster ya sustituidos.
 */
export const buildPreview = (
  formula: string,
  raw: number,
  damageType?: DamageType
): AbilityDamagePreview => {
  const { min, max } = computeDamageRange(raw)
  return {
    min,
    max,
    formula,
    damageTypeLabel: damageType ? getDamageTypeLabel(damageType) : undefined
  }
}

/**
 * Deriva un `previewDamage` automático a partir de un pipeline. Usado por
 * el registry para rellenar `IAbility.previewDamage` si la ability tiene
 * `pipeline` y NO tiene `customPreview`.
 */
export function previewFromPipeline(
  pipeline: DamageStep | DamageStep[],
  damageType?: DamageType
): (hero: Hero) => AbilityDamagePreview {
  return (hero: Hero) => {
    const raw = computeRawDamage(pipeline, hero)
    const formula = describePipeline(pipeline, hero)
    return buildPreview(formula + '  ' + dmgSuffix(damageType ?? 'physical'), raw, damageType)
  }
}

export const showCritAnnouncement = (
  effects: AbilityEffects,
  ability: IAbility | undefined,
  damage: number,
  isOvercrit: boolean = false
) => {
  const dmgType = ability?.damageType as DamageTypeId | undefined
  const typeLabel = dmgType ? getDamageTypeLabel(dmgType) : 'Físico'
  const prefix = isOvercrit ? '¡Overcrit!' : 'Crítico'
  effects.showAnnouncement(`${prefix} ${damage} ${typeLabel}`, 'crit', 1800, { priority: 100, interrupt: true })
}

export const buildAttackLog = (abilityName: string, damage: number, crit: CritResult): string => {
  const base = `Usaste ${abilityName} causando ${damage} de daño.`
  if (crit.isOvercrit) return `¡Overcrit! ${base}`
  if (crit.isCrit) return `Crítico ${base}`
  return base
}

/**
 * Pipeline completo de "pegarle a alguien":
 *   raw → variance → outgoingMult (buffs) → crit → takeDamage → hit popup
 *         → crit announcement (si crit) → log → SFX → hit sound delayed
 *
 * Devuelve `{finalDamage, crit, baseDamage}`. El caller decide si aplicar
 * `finalDamage` al target (típicamente ya se aplicó adentro via `takeDamage`).
 *
 * Encapsula el boilerplate que las 8+ abilities ofensivas repetían a mano.
 * Acepta cualquier `DamageCaster` (Hero o Enemy) — el sistema de abilities
 * es uniforme para ambos bandos.
 */
export function dealDamage(args: {
  caster: DamageCaster
  target: ICharacter
  ability: IAbility
  rawDamage: number
  effects: AbilityEffects
  range?: DamageVarianceRange
}): { finalDamage: number, crit: CritResult, baseDamage: number } {
  const { caster, target, ability, rawDamage, effects, range } = args
  const baseDamage = applyDamageVariance(rawDamage, range)

  if (baseDamage <= 0) {
    return { finalDamage: 0, crit: { multiplier: 1, isCrit: false, isOvercrit: false }, baseDamage: 0 }
  }

  // Buffs/debuffs que afectan el daño saliente del caster (ej. STRENGTH_BOOST
  // sube +25%). El multiplicador se aplica SOBRE el base post-varianza y
  // ANTES del critico: asi el critico escala tambien el buff (un crit de un
  // ataque buffado sigue pegando fuerte).
  const outgoingMult = getOutgoingDamageMultiplier(caster.statusEffects)
  const scaledDamage = Math.floor(baseDamage * outgoingMult)
  const crit = caster.rollCrit()
  const finalDamage = crit.isCrit
    ? Math.floor(scaledDamage * crit.multiplier)
    : scaledDamage

  if (finalDamage > 0) {
    target.takeDamage(finalDamage, { damageType: ability.damageType })
    effects.showEnemyHit(target.id, finalDamage, crit.isCrit)
    playAbilitySfx(effects.audioManager, ability)
    setTimeout(() => effects.audioManager.playHitSound(), 150)
  }

  if (crit.isCrit) showCritAnnouncement(effects, ability, finalDamage, crit.isOvercrit)
  effects.log(buildAttackLog(ability.name, finalDamage, crit))

  return { finalDamage, crit, baseDamage }
}
