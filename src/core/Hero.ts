import { Character } from './Character'
import type { IAbility } from './interfaces/IAbility'
import type { IStatusEffect } from './interfaces/IStatusEffect'
import type { ICombatant, IInventory, ILevelable, IPlayerStats, IStat } from './interfaces/ICharacter'
import { BasicAttack } from './abilities/Abilities'
import { DOT_STATUS_TYPES } from './StatusEffects'
import { computeDefense, computeMagicDefense } from './defense/computeDefense'
import { computeAgilityCritBonus, rollCritFromChance, type CritResult } from './crit'

/** Multiplicador lineal del bonus de Constitución sobre la vida máxima. */
const CONSTITUTION_HP_SCALE = 4

/** Ganancia base de vida por nivel (independiente de stats). */
const HP_PER_LEVEL = 20

/**
 * Bonus lineal de Constitución sobre la vida máxima. Misma forma que
 * `CONSTITUTION_DEFENSE_SCALE` en defensa física: por debajo del neutro
 * (10) no resta; por encima aporta `×CONSTITUTION_HP_SCALE` HP.
 */
function computeConstitutionHpBonus(con: IStat): number {
  return Math.max(0, con.value - 10) * CONSTITUTION_HP_SCALE
}

/**
 * Descripciones por defecto de cada stat. Viven en Hero porque son
 * informacion del dominio (no de la subclase): cualquier clase que tenga
 * `mind` lo describe igual. Las subclases solo pasan `value` y
 * `growthPerLevel`; el constructor completa la `description`.
 */
const STAT_DESCRIPTIONS: Record<keyof IPlayerStats, string> = {
  agility: 'Determina cuándo actúa el héroe en combate.',
  constitution: 'Resistencia física y vitalidad.',
  mind: 'Poder mágico y hechizos.',
  body: 'Fuerza bruta y capacidad física.'
}

/**
 * Toda stat crece al menos `STAT_BASE_GROWTH` por nivel. El
 * `growthPerLevel` de la stat es un modificador extra sobre esa base
 * (0 = crecimiento estándar, 1 = un punto más rápido, etc.).
 */
const STAT_BASE_GROWTH = 1

/** Input de stat que pasan las subclases (sin description, lo completa Hero). */
export type IStatInput = Omit<IStat, 'description'>

export interface HeroOptions {
  id: string
  name: string
  level?: number
  maxHealth: number
  maxEnergy?: number
  startingEnergy?: number
  agility: IStatInput
  constitution: IStatInput
  mind: IStatInput
  body: IStatInput
  critChance?: number
  sprite?: string
  basicAttack?: IAbility
  /**
   * Identificador estable de la clase del heroe (ej. 'warrior', 'cleric').
   *
   * Se usa para deduplicar/distinguir clases sin depender de
   * `constructor.name`, que el bundler/minifier puede renombrar en
   * build de produccion. Si la subclase no lo pasa, el constructor
   * lo rellena a partir de `constructor.name` como fallback.
   */
  heroClassId?: string
}

export class Hero extends Character implements ICombatant, ILevelable, IInventory {
  public experience: number
  public experienceToNextLevel: number
  public gold: number
  public abilities: IAbility[]
  public statusEffects: IStatusEffect[] = []
  public energy: number
  public maxEnergy: number
  /**
   * Recurso "Heroismo": barra dorada compartida por todas las clases
   * (0..maxHeroism). Se carga pasivamente cada turno, al realizar ataques
   * y al recibir daño. Al llegar a `maxHeroism`, el heroe puede desatar
   * su habilidad definitiva (coste `heroismCost: 100`).
   */
  public heroism: number
  public maxHeroism: number
  public baseStats: IPlayerStats
  public critChance: number
  public critDamageMultiplier: number
  public sprite: string
  /**
   * Identificador estable de la clase del heroe (ej. 'warrior', 'cleric').
   * Establecido por la subclase al construir el Hero. Se usa para
   * deduplicar/distinguir clases sin depender de `constructor.name`.
   *
   * Es `readonly` para evitar mutaciones accidentales en runtime; el
   * valor debe fijarse en la constructora de la subclase.
   */
  public readonly heroClassId: string
  /**
   * Regen pasiva de energia al final del turno del jugador.
   * Por defecto 0; clases, perks o equipo pueden modificarlo.
   */
  public passiveEnergyRegen: number = 0
  /**
   * Heroismo que se acumula automaticamente al final del turno del jugador.
   * Se suma ademas al cargar por ataques y al recibir daño. Default 10.
   */
  public passiveHeroismRegen: number = 10
  /**
   * Divisor para convertir el daño infringido en Heroismo: el caster
   * gana `floor(finalDamage / divisor)` por cada golpe que asesta
   * (incluye el ultimate warrior). Default 20 → un golpe de 30 de
   * daño aporta ~1-2 de Heroismo. Es deliberadamente BAJO para que
   * pegar no sea la vía principal de carga — el daño recibido debe
   * rendir mas (ver `heroismPerDamageTakenDivisor`).
   */
  public heroismPerDamageDealtDivisor: number = 20
  /**
   * Divisor para convertir el daño recibido en Heroismo: el heroe gana
   * `floor(damageTaken / divisor)` cada vez que recibe un golpe.
   * Default 3 → 30 de daño sufrido = 10 de Heroismo. Es DELIBERADAMENTE
   * MAS GENEROSO que el daño hecho (1 cada 20 vs 1 cada 3) para que
   * la definitiva se cargue sobre todo en peleas encarnizadas donde
   * el heroe esta sufriendo.
   */
  public heroismPerDamageTakenDivisor: number = 3

  /**
   * Vida base de la clase al nivel 1, sin contar Constitución.
   * Se guarda para que `maxHealth` se pueda recalcular en cada levelUp
   * cuando Constitución crece (de lo contrario el bonus de CON se "congela"
   * al construirse el personaje).
   */
  private baseMaxHealth: number

  constructor(opts: HeroOptions) {
    super(opts.id, opts.name, opts.level ?? 1, opts.maxHealth)
    this.experience = 0
    this.experienceToNextLevel = 100
    this.gold = 0
    this.abilities = []
    this.maxEnergy = opts.maxEnergy ?? 50
    this.energy = opts.startingEnergy ?? this.maxEnergy
    this.maxHeroism = 100
    this.heroism = 0
    this.critChance = opts.critChance ?? 5
    this.critDamageMultiplier = 2.0
    this.sprite = opts.sprite ?? ''
    // Fallback: si la subclase no pas explicito heroClassId, usamos
    // constructor.name (estable en dev, posible renaming en prod).
    this.heroClassId = opts.heroClassId
      ?? (new.target?.name?.toLowerCase() || 'unknown')
    this.baseStats = {
      agility: { ...opts.agility, description: STAT_DESCRIPTIONS.agility },
      constitution: { ...opts.constitution, description: STAT_DESCRIPTIONS.constitution },
      mind: { ...opts.mind, description: STAT_DESCRIPTIONS.mind },
      body: { ...opts.body, description: STAT_DESCRIPTIONS.body }
    }
    this.baseMaxHealth = opts.maxHealth
    this.recomputeMaxHealth()
    // `super()` ya asigno `this.health = opts.maxHealth` (la vida base de
    // la clase), pero `recomputeMaxHealth` acaba de actualizar
    // `this.maxHealth` con el bonus de Constitucion. Sin este ajuste la
    // barra de HP queda por debajo del maximo justo al seleccionar al
    // heroe en la pantalla de inicio (mismo patron que `levelUp()`).
    this.health = this.maxHealth

    this.learnAbility(opts.basicAttack ?? BasicAttack)
  }

  /**
   * Recalcula `maxHealth` a partir de la vida base de la clase + bonus
   * actual de Constitución + bonus por nivel. Idempotent.
   */
  private recomputeMaxHealth(): void {
    const conBonus = computeConstitutionHpBonus(this.baseStats.constitution)
    const levelBonus = (this.level - 1) * HP_PER_LEVEL
    this.maxHealth = this.baseMaxHealth + conBonus + levelBonus
  }

  public learnAbility(ability: IAbility): void {
    if (!this.abilities.find(a => a.type === ability.type)) {
      this.abilities.push(ability)
    }
  }

  /**
   * Daño base del héroe. Misma forma que `Enemy.attack()`: solo `body`
   * (stat de daño físico) + bonus de nivel. No hay `baseAttack` aparte:
   * la diferenciación entre clases viene por el `value` de body y por las
   * abilities, igual que enemigos usan solo body.
   */
  public attack(): number {
    if (!this.isAlive) return 0
    return (this.baseStats.body.value - 10) * 0.5 + this.level * 1
  }

  /**
   * Daño mágico base: espejo de `attack()` pero escalando con `mind`
   * (coeficiente 0.4, mismo que `SCALING_COEFFICIENTS.mind`).
   *
   * El bonus de Mente se capa a 0 (igual que la defensa física) para
   * evitar penalizar a magos con Mente < 10 y para no mostrar números
   * negativos en tooltips. El resultado se redondea porque `(mind-10)*0.4`
   * genera ruido de coma flotante al sumarle `level` (p.ej. mind=8 daba
   * `0.19999999999999996` en vez de `1`).
   *
   * Es lo que las abilities/hechizos del héroe usan como base antes de
   * sumar el modificador de la habilidad concreta.
   */
  public magicAttack(): number {
    if (!this.isAlive) return 0
    const mindBonus = Math.max(0, this.baseStats.mind.value - 10) * 0.4
    return Math.round(mindBonus + this.level * 1)
  }

  public defense(): number {
    return computeDefense(this.baseStats.body, this.baseStats.constitution)
  }

  /**
   * Defensa mágica: mitigación contra daño mágico (fuego, frío, veneno,
   * arcano, holy, radiant, shadow). Escala con `mind`, no con body.
   *
   * Usada por el motor de defensa cuando el patrón enemigo tiene
   * `damageType` mágico. Ver `computeMagicDefense` para los detalles de la
   * fórmula.
   */
  public magicDefense(): number {
    return computeMagicDefense(this.baseStats.mind)
  }

  /**
   * Chance de critico efectiva en puntos de porcentaje: `critChance` base +
   * bonus de agilidad (escala logaritmica sobre el neutro 10). No tiene cap
   * duro: si `critChance + bonus > 100` parte de los crits seran overcrits.
   */
  public getEffectiveCritChance(): number {
    return this.critChance + computeAgilityCritBonus(this.baseStats.agility.value)
  }

  /**
   * Tirada probabilistica de critico del heroe.
   * Usa `getEffectiveCritChance()` (incluye bonus de agilidad).
   */
  public rollCrit(): CritResult {
    if (!this.isAlive) {
      return { multiplier: 1, isCrit: false, isOvercrit: false }
    }
    return rollCritFromChance(this.getEffectiveCritChance())
  }

  public gainExperience(amount: number): void {
    this.experience += amount
    while (this.experience >= this.experienceToNextLevel) {
      this.levelUp()
    }
  }

  public levelUp(): void {
    this.level++
    this.experience -= this.experienceToNextLevel
    this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.5)
    this.baseStats.agility.value += STAT_BASE_GROWTH + this.baseStats.agility.growthPerLevel
    this.baseStats.constitution.value += STAT_BASE_GROWTH + this.baseStats.constitution.growthPerLevel
    this.baseStats.mind.value += STAT_BASE_GROWTH + this.baseStats.mind.growthPerLevel
    this.baseStats.body.value += STAT_BASE_GROWTH + this.baseStats.body.growthPerLevel
    this.recomputeMaxHealth()
    this.health = this.maxHealth
    this.maxEnergy += 10
    this.energy = this.maxEnergy
  }

  public spendEnergy(amount: number): boolean {
    if (this.energy < amount) return false
    this.energy -= amount
    return true
  }

  public restoreEnergy(amount: number): number {
    const before = this.energy
    this.energy = Math.min(this.maxEnergy, this.energy + amount)
    return this.energy - before
  }

  /**
   * Cuanta energia recupera este heroe al final de su turno.
   * Default: usa `passiveEnergyRegen`. Subclases o perks pueden override
   * para condiciones dinamicas (e.g. "regenera segun HP perdido").
   */
  public getTurnEndEnergyRegen(): number {
    return this.passiveEnergyRegen
  }

  /**
   * Cuanto Heroismo gana este heroe al final de su turno.
   * Default: usa `passiveHeroismRegen`. Subclases o perks pueden override.
   */
  public getTurnEndHeroismRegen(): number {
    return this.passiveHeroismRegen
  }

  /**
   * Gasta `amount` puntos de Heroismo si hay suficiente. Devuelve `true`
   * si se desconto; `false` si no alcanzaba (no se modifica el recurso).
   */
  public spendHeroism(amount: number): boolean {
    if (amount <= 0) return true
    if (this.heroism < amount) return false
    this.heroism -= amount
    return true
  }

  /**
   * Suma `amount` puntos de Heroismo capeando en `maxHeroism`. Devuelve
   * la cantidad realmente anadida (util para logs/feedback de UI).
   */
  public restoreHeroism(amount: number): number {
    if (amount <= 0) return 0
    const before = this.heroism
    this.heroism = Math.min(this.maxHeroism, this.heroism + amount)
    return this.heroism - before
  }

  /**
   * `true` si la barra de Heroismo esta al maximo y el heroe esta en
   * condiciones de desatar su habilidad definitiva.
   */
  public canUseUltimate(): boolean {
    return this.isAlive && this.heroism >= this.maxHeroism
  }

  public addGold(amount: number): void {
    this.gold += amount
  }

  /**
   * Hook de Heroismo: al recibir daño, una fraccion del HP perdido se
   * convierte en Heroismo (cuanto mas duele el golpe, mas heroismo se
   * forja). Llama a `super.takeDamage` para mantener intacta la logica
   * de escudos/multiplicadores de `Character`.
   */
  public takeDamage(amount: number, opts?: { damageType?: string }): void {
    if (!this.isAlive || amount <= 0) return
    const before = this.health
    super.takeDamage(amount, opts)
    const lost = before - this.health
    if (lost <= 0) return
    const divisor = Math.max(1, this.heroismPerDamageTakenDivisor)
    const gained = Math.floor(lost / divisor)
    if (gained > 0) this.restoreHeroism(gained)
  }

  public spendGold(amount: number): boolean {
    if (this.gold < amount) return false
    this.gold -= amount
    return true
  }

  public addStatusEffect(effect: IStatusEffect) {
    const existing = this.statusEffects.find(e => e.type === effect.type)
    const isDot = DOT_STATUS_TYPES.has(effect.type)
    if (existing) {
      if (isDot) {
        const incomingStacks = effect.stacks ?? 1
        const maxStacks = existing.maxStacks ?? effect.maxStacks ?? 99
        existing.stacks = Math.min(maxStacks, (existing.stacks ?? 1) + incomingStacks)
      } else {
        const maxDuration = effect.maxDuration ?? effect.turns
        existing.maxDuration = maxDuration
        existing.turns = maxDuration
      }
    } else {
      const copy: IStatusEffect = { ...effect }
      if (isDot) {
        copy.stacks = effect.stacks ?? 1
        copy.maxStacks = effect.maxStacks ?? 99
      }
      copy.maxDuration = effect.maxDuration ?? effect.turns
      this.statusEffects.push(copy)
    }
  }

  public hasStatusEffect(type: string): boolean {
    return this.statusEffects.some(e => e.type === type && e.turns > 0)
  }

  public reduceStatusEffects() {
    // Los efectos basados en cargas (charges) se gobiernan por su propio
    // mecanismo de consumo (processPlayerOnBlockHooks), nunca por turnos.
    this.statusEffects.forEach(e => {
      if (typeof e.charges === 'number') return
      e.turns--
    })
    this.removeExpiredStatusEffects()
  }

  public removeExpiredStatusEffects() {
    this.statusEffects = this.statusEffects.filter(e => e.turns > 0)
  }

  public isStunned(): boolean {
    // Cualquier CC que skipee el turno cuenta. Ver `isSkipTurnEffect` en
    // TurnEngine.ts para el set canonico (stun, horror). `rooted` ya no
    // entra porque dejo de skipear el turno (ahora solo impide bloquear).
    return this.statusEffects.some(e => e.turns > 0 && (
      e.type === 'stun' || e.type === 'horror'
    ))
  }
}
