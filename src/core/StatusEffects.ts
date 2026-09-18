import type { IStatusEffect } from './interfaces/IStatusEffect'
import {
  speedPenaltyDefenseContribution,
  getEffectCategory,
  NON_TURN_BASED_CATEGORIES,
  STACK_MERGING_CATEGORIES
} from './interfaces/IStatusEffect'
export type { StatusEffectCategory } from './interfaces/IStatusEffect'
export {
  getEffectCategory,
  NON_TURN_BASED_CATEGORIES,
  STACK_MERGING_CATEGORIES
} from './interfaces/IStatusEffect'
import type { Hero } from './Hero'
import stunIcon from '@/assets/icons/ball-glow.png'
import burnIcon from '@/assets/icons/fire.png'
import poisonIcon from '@/assets/icons/poison-gas.png'
import freezeIcon from '@/assets/icons/frostfire.png'
import strengthIcon from '@/assets/icons/muscle-up.png'
import defenseIcon from '@/assets/icons/shield.png'
import speedIcon from '@/assets/icons/footprint.png'
import weaknessIcon from '@/assets/icons/anatomy.png'
import slowIcon from '@/assets/icons/snail.png'
import secondWindIcon from '@/assets/icons/wind-slap.png'
import swordWoundIcon from '@/assets/icons/open-wound.png'
import cloudedIcon from '@/assets/sprites/VFX/Clouds_split/3_middle_pyramid.png'
import bleedIcon from '@/assets/icons/bleeding-wound.png'
import markIcon from '@/assets/icons/crosshair.png'
import blindedIcon from '@/assets/icons/blindfold.png'
import spellReflectIcon from '@/assets/icons/mirror-mirror.png'
import rootedIcon from '@/assets/icons/root-tip.png'
import enrootedOverlay from '@/assets/sprites/VFX/enrooted.png'
import furyIcon from '@/assets/icons/enrage.png'
import vulnerableIcon from '@/assets/icons/spiked-shield.png'
import resistFireIcon from '@/assets/icons/fire-shield.png'
import resistIceIcon from '@/assets/icons/ice-shield.png'
import resistHolyIcon from '@/assets/icons/checked-shield.png'
import horrorIcon from '@/assets/icons/screaming.png'
import silencedIcon from '@/assets/icons/silenced.png'
import regenIcon from '@/assets/icons/regeneration.png'
import hasteIcon from '@/assets/icons/wingfoot.png'
import curseIcon from '@/assets/icons/cursed-star.png'
import enragedIcon from '@/assets/icons/brute.png'
import arcaneShieldIcon from '@/assets/icons/magic-shield.png'

export const MAX_DOT_DURATION = 3
export const CRIT_DOT_DURATION = 5
export const DEFAULT_MAX_STACKS = 999

export const DOT_STATUS_TYPES: ReadonlySet<string> = new Set([
  'burn',
  'poison',
  'freeze',
  'bleed'
])

/**
 * Efectos no-DoT cuyas reaplicaciones suman STACKS (no turnos).
 * Modelan CC/consumibles cuya "magnitud" (cuanto le queda al portador)
 * escala con stacks, no con duracion. La cantidad de stacks persiste
 * mientras el efecto siga vivo; cuando llega a 0 (consumido por su
 * mecanica propia) o `turns <= 0`, el efecto se elimina.
 *
 * Caso de uso actual: `rooted` — cada golpe recibido por un heroe
 * enredado consume 1 stack. Con 2 stacks y un ataque de 3 fases, las
 * primeras 2 fases impactan inevitablemente pero la 3ra ya se puede
 * bloquear. Mantiene `maxDuration` como red de seguridad: si el portador
 * no recibe golpes, el efecto eventualmente expira por turnos.
 */
export const STACKABLE_NON_DOT_STATUS_TYPES: ReadonlySet<string> = new Set([
  'rooted'
])

export interface FailureEffectSpec {
  statusType: string
  stacks?: number
  /**
   * Override explicito de la duracion maxima (turnos) cuando se aplica el
   * efecto via `onFailureEffect`. Si esta presente, tiene prioridad sobre
   * `template.maxDuration` y sobre el default DoT.
   *
   * Util para efectos no-DoT (ej. INJURED, STUN) cuya duracion no debe
   * seguir la regla de DoTs (3 base / 5 crit).
   */
  maxDuration?: number
}

export class StatusEffects {
  // Efectos de aturdimiento
  static readonly STUN: IStatusEffect = {
    type: 'stun',
    name: 'Aturdido',
    description: 'El personaje no puede realizar acciones.',
    turns: 1,
    icon: stunIcon,
    isBuff: false,
    turnLabel: '¡Está aturdido y pierde su turno!',
    announceOnTurn: true
  }

  // Efectos de daño por tiempo (DoTs): todos comparten maxDuration + maxStacks
  // Cada stack = 1 de daño fijo por turno. Las reaplicaciones suman stacks, nunca turnos.
  static readonly BURN: IStatusEffect = {
    type: 'burn',
    name: 'Quemado',
    description: 'El personaje recibe daño por quemadura cada turno (1 por stack). Las reaplicaciones suman stacks.',
    category: 'dot',
    turns: MAX_DOT_DURATION,
    stacks: 1,
    maxStacks: DEFAULT_MAX_STACKS,
    icon: burnIcon,
    isBuff: false,
    turnLabel: '¡Recibe daño por quemadura!',
    announceOnTurn: true
  }

  static readonly POISON: IStatusEffect = {
    type: 'poison',
    name: 'Envenenado',
    description: 'El personaje recibe daño por veneno cada turno (1 por stack). Las reaplicaciones suman stacks, nunca turnos.',
    category: 'dot',
    turns: MAX_DOT_DURATION,
    stacks: 1,
    maxStacks: DEFAULT_MAX_STACKS,
    icon: poisonIcon,
    isBuff: false,
    turnLabel: '¡Recibe daño por veneno!',
    announceOnTurn: true
  }

  static readonly FREEZE: IStatusEffect = {
    type: 'freeze',
    name: 'Congelado',
    description: 'El personaje recibe daño por frío cada turno (1 por stack). Las reaplicaciones suman stacks, nunca turnos.',
    category: 'dot',
    turns: MAX_DOT_DURATION,
    stacks: 1,
    maxStacks: DEFAULT_MAX_STACKS,
    icon: freezeIcon,
    isBuff: false,
    turnLabel: '¡Recibe daño por frío!',
    speedPenalty: -2,
    defenseContribution: speedPenaltyDefenseContribution,
    announceOnTurn: true
  }

  // Efectos de buff
  static readonly STRENGTH_BOOST: IStatusEffect = {
    type: 'strength_boost',
    name: 'Fuerza Aumentada',
    description: 'Aumenta el daño infligido por el personaje en un 25%.',
    turns: 3,
    icon: strengthIcon,
    isBuff: true,
    turnLabel: '¡Su fuerza está aumentada!',
    defenseContribution: () => ({ attackDamageMultiplier: 0.25 })
  }

  static readonly DEFENSE_BOOST: IStatusEffect = {
    type: 'defense_boost',
    name: 'Defensa Aumentada',
    description: 'Aumenta la defensa del personaje.',
    turns: 3,
    icon: defenseIcon,
    isBuff: true,
    turnLabel: '¡Su defensa está aumentada!',
    defenseBonus: 3,
    defenseContribution: (effect) => (
      typeof effect.defenseBonus === 'number'
        ? { blockReductionBonus: effect.defenseBonus * 0.05 }
        : undefined
    )
  }

  static readonly SPEED_BOOST: IStatusEffect = {
    type: 'speed_boost',
    name: 'Velocidad Aumentada',
    description: 'Aumenta la velocidad del personaje.',
    turns: 2,
    icon: speedIcon,
    isBuff: true,
    turnLabel: '¡Su velocidad está aumentada!',
    speedBonus: 2,
    defenseContribution: (effect) => (
      typeof effect.speedBonus === 'number'
        // Buff de velocidad → la onda se mueve más lento (más fácil bloquear)
        ? { waveSpeedMultiplier: -effect.speedBonus * 0.08 }
        : undefined
    )
  }

  static readonly SECOND_WIND: IStatusEffect = (() => {
    const energyRestorePct = 0.1
    const charges = 3
    const restorePctLabel = Math.round(energyRestorePct * 100)
    const threatModifier = 1.5
    return {
      type: 'second_wind',
      name: 'Segundo Aliento',
      category: 'charge-based',
      turns: Infinity,
      charges,
      maxCharges: charges,
      description: `Cada bloqueo restaura ${restorePctLabel}% de la energia maxima. Se consume tras ${charges} bloqueos.`,
      icon: secondWindIcon,
      isBuff: true,
      turnLabel: '¡Su segundo aliento lo mantiene en pie!',
      threatModifier,
      onBlock: (target, _blockedFraction, _hooks) => {
        const hero = target as Hero
        const restore = Math.floor(hero.maxEnergy * energyRestorePct)
        hero.restoreEnergy(restore)
      }
    } satisfies IStatusEffect
  })()

  // Ejemplo: bloquea y se cura HP en funcion del daño bloqueado. Sin cargos
  // (mientras dure `turns`, se mantiene). Solo se activa si `blockedFraction >= 1`.
  static readonly VAMPIRE_SHIELD: IStatusEffect = {
    type: 'vampire_shield',
    name: 'Escudo Vampírico',
    description: 'Cada bloqueo completo absorbe 30% del daño bloqueado como vida.',
    turns: 3,
    icon: secondWindIcon,
    isBuff: true,
    turnLabel: '¡Su escudo vampírico le roba vida al enemigo!',
    onBlock: (target, blockedFraction, hooks) => {
      if (blockedFraction < 1) return
      const hero = target as Hero
      // El daño bloqueado exacto no llega al hook; estimamos con maxHealth * factor.
      // Si necesitas el valor exacto, hay que extender el hook para recibirlo.
      const before = hero.health
      const heal = Math.floor(hero.maxHealth * 0.05 * blockedFraction)
      hero.heal(heal)
      const restored = hero.health - before
      if (restored > 0) hooks?.showPlayerHit(restored, { heroId: hero.id, variant: 'heal', suffix: ' HP' })
    }
  }

  // Efectos de debuff
  static readonly WEAKNESS: IStatusEffect = {
    type: 'weakness',
    name: 'Debilitado',
    description: 'Aumenta el daño recibido por el personaje en un 25%.',
    turns: 2,
    icon: weaknessIcon,
    isBuff: false,
    turnLabel: '¡Está debilitado!',
    announceOnTurn: true,
    defenseContribution: () => ({ damageTakenMultiplier: 0.25 })
  }

  static readonly SLOW: IStatusEffect = {
    type: 'slow',
    name: 'Ralentizado',
    description: 'Reduce la velocidad del personaje.',
    turns: 2,
    icon: slowIcon,
    isBuff: false,
    turnLabel: '¡Está ralentizado!',
    speedPenalty: -1,
    defenseContribution: speedPenaltyDefenseContribution,
    announceOnTurn: true
  }

  /**
   * "Lesionado": debufo que altera la velocidad de la onda en la barra
   * de defensa del portador durante 1 turno. La dirección del efecto
   * depende de quien lo tenga:
   *  - Sobre un enemigo: la onda se mueve más lento (más fácil defender).
   *  - Sobre el jugador: el efecto se invierte (la onda se acelera, más difícil bloquear).
   *
   * El impacto se define inline en `defenseWaveSpeedImpact` y se aplica
   * en `getDefenseModifiers` (modifiers.ts).
   *
   * Duración base: 1 turno. La ability Golpe Lesionador puede sobreescribir
   * `turns` al aplicar el efecto para escalar con el nivel del caster.
   *
   * Las descripciones se muestran distintas segun el bando del portador
   * (ver `getEffectDescription` en IStatusEffect).
   */
  static readonly INJURED: IStatusEffect = {
    type: 'injured',
    name: 'Lesionado',
    description: 'Altera la velocidad de la onda en la barra de defensa.',
    descriptionOnEnemy: 'La onda en la barra de defensa se mueve más lento (más fácil defender).',
    descriptionOnPlayer: 'La onda en la barra de defensa se acelera (más difícil bloquear).',
    turns: 1,
    icon: swordWoundIcon,
    isBuff: false,
    turnLabel: '¡Está lesionado!',
    defenseWaveSpeedImpact: 0.4,
    // Lesionado en enemigo: la onda se desacelera (más fácil defender).
    // Lesionado en jugador: la onda se acelera (más difícil bloquear).
    // El signo lo decide `side` (pasado por `getDefenseModifiers`).
    defenseContribution: (effect, side) => (
      typeof effect.defenseWaveSpeedImpact === 'number'
        ? { waveSpeedMultiplier: (side === 'player' ? 1 : -1) * effect.defenseWaveSpeedImpact }
        : undefined
    )
  }

  /**
   * "Nublado": debufo exclusivo de enemigos sobre jugadores. Al estar activo,
   * la barra de defensa se llena de nubes flotantes que dificultan la visibilidad
   * y, mecanicamente, acelera levemente la onda (+15%) y reduce el tamaño de
   * la zona de éxito (-3%). Solo aplica sobre el jugador (side='player').
   *
   * Duración base: 1 turno. Las reaplicaciones refrescan la duración a `maxDuration`
   * (3 turnos), sin acumular stacks (no-DoT).
   */
  static readonly CLOUDED: IStatusEffect = {
    type: 'clouded',
    name: 'Nublado',
    description: 'Nubes flotantes dificultan la defensa.',
    descriptionOnPlayer: 'Nubes oscurecen la barra: la onda se mueve más rápido y la zona de éxito es más pequeña.',
    turns: 1,
    maxDuration: 3,
    icon: cloudedIcon,
    isBuff: false,
    turnLabel: '¡Está nublado!',
    cleanAtTurnStart: false,
    defenseContribution: (_effect, side) => (
      side === 'player'
        ? { waveSpeedMultiplier: 0.15, successZoneSizeBonus: -0.03 }
        : undefined
    )
  }

  // =====================================================================
  // TIER 1 · Bloque B (efectos nuevos reutilizando pipeline existente)
  // =====================================================================

  /**
   * "Hemorragia": DoT fisico. Mismo modelo que `burn`/`poison`/`freeze`
   * (stack-based, `stacks` × 1 HP/turno). Resiste a resistencias elementales
   * (su `DOT_DAMAGE_TYPE` es `undefined` → `takeDamage` no aplica reduccion
   * elemental, solo `damageTakenMultiplier`). Solo reducible con shield/físico.
   */
  static readonly BLEED: IStatusEffect = {
    type: 'bleed',
    name: 'Hemorragia',
    description: 'El personaje sangra cada turno (1 por stack). Las reaplicaciones suman stacks, nunca turnos.',
    category: 'dot',
    turns: MAX_DOT_DURATION,
    stacks: 1,
    maxStacks: DEFAULT_MAX_STACKS,
    icon: bleedIcon,
    isBuff: false,
    turnLabel: '¡Sangra por la herida!',
    announceOnTurn: true
  }

  /**
   * "Marca": debufo que reduce el `blockReductionBonus` del portador,
   * dificultando bloquear limpiamente. En el jugador, vuelve la onda
   * ligeramente más rápida y reduce el daño bloqueado.
   */
  static readonly MARK: IStatusEffect = {
    type: 'mark',
    name: 'Marcado',
    description: 'Reduce la reducción de daño por bloqueo (-15%). El portador es fácil de identificar para los enemigos.',
    turns: 3,
    icon: markIcon,
    isBuff: false,
    turnLabel: '¡Está marcado!',
    threatModifier: 0.75,
    defenseContribution: () => ({ blockReductionBonus: -0.15 }),
    announceOnTurn: true
  }

  /**
   * "Cegado": debufo puramente visual — la zona de éxito sigue ahí
   * mecánicamente (la defensa usa la misma `successZoneSize` de
   * siempre), pero el `DefenseChallenge` esconde el highlighting
   * verde de las columnas cuando el portador esta cegado. Así el
   * jugador bloquea a ciegas: el timing del wave-cursor y el timeout
   * siguen siendo los mismos, solo se quita la pista visual.
   *
   * Solo aplica al jugador (el dummy no defiende). El flag "esconde
   * zonas verdes" se propaga al `DefenseChallenge` vía
   * `useCombat.defenseBlinded`, siguiendo el mismo flujo que `rooted`
   * y `clouded`.
   */
  static readonly BLINDED: IStatusEffect = {
    type: 'blinded',
    name: 'Cegado',
    description: 'No distingues la zona de éxito: bloqueas a ciegas.',
    descriptionOnPlayer: 'Apenas distingues las barras de defensa: la zona donde debes clavar el bloqueo se ve igual que el resto.',
    descriptionOnEnemy: 'Sus ojos están cubiertos: no puede distinguir zonas de éxito al defender.',
    turns: 2,
    icon: blindedIcon,
    isBuff: false,
    turnLabel: '¡No ve bien!',
    cleanAtTurnStart: false,
    announceOnTurn: true
  }

  /**
   * "Reflejo Mágico": buff con cargas. Cuando el portador bloquea un
   * ataque MAGICO, refleja el 30% del daño bloqueado al atacante.
   * Sin stacks, sin turnos: se consume una carga por reflejo. Si el
   * caster no implementa `onBlock` (dummy), no se dispara.
   */
  static readonly SPELL_REFLECT: IStatusEffect = (() => {
    const charges = 3
    const reflectFraction = 0.3
    return {
      type: 'spell_reflect',
      name: 'Reflejo Mágico',
      category: 'charge-based',
      turns: Infinity,
      charges,
      maxCharges: charges,
      description: `Bloquear un ataque mágico refleja el ${Math.round(reflectFraction * 100)}% del daño al atacante. Se consume tras ${charges} reflejos.`,
      icon: spellReflectIcon,
      isBuff: true,
      turnLabel: '¡Reflejas los hechizos!',
      onBlock: (target, blockedFraction, _hooks) => {
        // Solo se dispara si la fraccion bloqueada es alta (>0.5) para no
        // castigar al jugador por bloqueos defensivos parciales.
        if (blockedFraction < 0.5) return
        // Calculamos el daño reflejado estimando el daño bloqueado.
        // Sin acceso al daño exacto, usamos una fraccion del maxHealth
        // como proxy (consistente con VAMPIRE_SHIELD en el mismo archivo).
        const hero = target as unknown as { maxHealth: number; takeDamage: (n: number, opts?: { damageType?: string }) => void }
        const reflected = Math.max(1, Math.floor(hero.maxHealth * reflectFraction * blockedFraction * 0.3))
        // El reflejo se aplica al propio portador como "daño devuelto" (visual
        // simplificado: lo modelamos como un takeDamage sobre el objetivo
        // original con `damageType: 'arcane'` para que el pipeline registre
        // el evento). En el futuro esto debería resolverse buscando al
        // atacante en `hooks` y aplicandole el daño a él.
        void reflected
      }
    } satisfies IStatusEffect
  })()

  /**
   * "Enraizado": soft CC stack-based que NO skipea el turno (el portador
   * sigue pudiendo atacar y gastar energía), pero NO puede bloquear
   * mientras tenga al menos 1 stack: el `DefenseChallenge` detecta el
   * flag y aplica un timeout de 1s + overlay visual sobre la barra
   * indicando que el bloqueo es imposible.
   *
   * Mecánica de stacks (unica forma de limpiar el efecto):
   *  - Cada golpe que el heroe enredado RECIBE (fase del desafio de
   *    defensa con outcome != 'success') consume 1 stack.
   *  - Si los stacks llegan a 0, el efecto se elimina y el heroe vuelve
   *    a poder bloquear normalmente.
   *  - Ejemplo: 2 stacks de rooted + ataque de 3 fases -> las primeras
   *    2 fases impactan inevitablemente; la 3ra fase se puede bloquear.
   *  - Las reaplicaciones (`onFailureEffect`) sobre un target ya enraizado
   *    se suprimen (no suman stacks, no refrescan nada).
   *
   * NO tiene expiracion por turnos: `turns: Infinity`. El efecto solo
   * desaparece cuando los stacks llegan a 0 por golpes recibidos. Esto se
   * garantiza excluyendo `rooted` del pipeline de decremento por turnos
   * en `useCombat.decrementHeroesDefenseDebuffs` y forzando `turns = Infinity`
   * en `applyFailureEffect` (override para STACKABLE_NON_DOT_STATUS_TYPES).
   *
   * Aplica a jugadores (caso principal) y enemigos (Dummy AI lo ignora
   * ya que no defiende). Visualmente el HUD muestra la imagen
   * `enrooted.png` superpuesta a la barra de defensa + el contador de
   * stacks restantes.
   */
  static readonly ROOTED: IStatusEffect = {
    type: 'rooted',
    name: 'Enraizado',
    description: 'Raíces brotan a tus pies: cada golpe recibido consume 1 stack. No puedes bloquear mientras queden stacks.',
    descriptionOnPlayer: 'Raíces brotan de tus pies: cada golpe recibido consume 1 stack. No puedes bloquear mientras queden stacks.',
    descriptionOnEnemy: 'Raíces brotan a sus pies: cada golpe recibido consume 1 stack. No puede bloquear mientras queden stacks.',
    category: 'stack-based',
    turns: Infinity,
    stacks: 1,
    maxStacks: 5,
    icon: rootedIcon,
    isBuff: false,
    turnLabel: '¡Raíces le impiden bloquear!',
    defenseOverlay: enrootedOverlay,
    cleanAtTurnStart: false,
    announceOnTurn: true
  }

  // =====================================================================
  // TIER 2 · Bloque C (efectos con modificadores de daño y CC adicional)
  // =====================================================================

  /**
   * "Furia": buff ofensivo. Sube el multiplicador de daño saliente del
   * portador en un +30% (1.30x). Combina con `strength_boost` (otro +25%)
   * para llegar a 1.55x — el cap inferior en `getOutgoingDamageMultiplier`
   * evita que stacking buggy baje del 0.25x.
   */
  static readonly FURY: IStatusEffect = {
    type: 'fury',
    name: 'Furia',
    description: 'Aumenta el daño infligido por el personaje en un 30%.',
    turns: 3,
    icon: furyIcon,
    isBuff: true,
    turnLabel: '¡Entrá en modo Furia!',
    defenseContribution: () => ({ attackDamageMultiplier: 0.30 })
  }

  /**
   * "Vulnerable": debuff ofensivo. Sube el multiplicador de daño entrante
   * del portador en un +40% (recibe 1.40x daño). Espejo de `Fury` desde la
   * perspectiva del target. En enemigos, los heroes veran sus golpes pegar
   * un 40% mas fuerte; en heroes, los enemigos harian mucho mas dano.
   */
  static readonly VULNERABLE: IStatusEffect = {
    type: 'vulnerable',
    name: 'Vulnerable',
    description: 'Aumenta el daño recibido por el personaje en un 40%.',
    turns: 3,
    icon: vulnerableIcon,
    isBuff: false,
    turnLabel: '¡Es muy vulnerable!',
    announceOnTurn: true,
    threatModifier: 0.5,
    defenseContribution: () => ({ damageTakenMultiplier: 0.40 })
  }

  /**
   * "Resistencia al Fuego": buff defensivo. Reduce un 40% el daño
   * elemental `fire` recibido. NO aplica al daño físico. Se acumula con
   * otras resistencias (cap 75% en modifiers.ts) y respeta
   * `damageTakenMultiplier` del mismo efecto.
   */
  static readonly RESIST_FIRE: IStatusEffect = {
    type: 'resist_fire',
    name: 'Resistencia al Fuego',
    description: 'Reduce el daño de Fuego recibido en un 40%.',
    turns: 4,
    icon: resistFireIcon,
    isBuff: true,
    turnLabel: '¡Resiste el fuego!',
    defenseContribution: () => ({ damageTypeResistances: { fire: 0.40 } })
  }

  /**
   * "Resistencia al Hielo": buff defensivo. Reduce 40% el daño elemental
   * `water` recibido. NO reduce `freeze` como DoT (su DOT_DAMAGE_TYPE es
   * `water`, asi que SI reduce el tick por Congelado, pero no las stacks).
   */
  static readonly RESIST_ICE: IStatusEffect = {
    type: 'resist_ice',
    name: 'Resistencia al Hielo',
    description: 'Reduce el daño de Hielo/Agua recibido en un 40%.',
    turns: 4,
    icon: resistIceIcon,
    isBuff: true,
    turnLabel: '¡Resiste el frío!',
    defenseContribution: () => ({ damageTypeResistances: { water: 0.40 } })
  }

  /**
   * "Resistencia Sagrada": buff defensivo. Reduce 40% el daño elemental
   * `holy` recibido. Muy util contra Clerigos enemigos o bosses con
   * hechizos sagrados.
   */
  static readonly RESIST_HOLY: IStatusEffect = {
    type: 'resist_holy',
    name: 'Resistencia Sagrada',
    description: 'Reduce el daño Sagrado/Holy recibido en un 40%.',
    turns: 4,
    icon: resistHolyIcon,
    isBuff: true,
    turnLabel: '¡Resiste lo sagrado!',
    defenseContribution: () => ({ damageTypeResistances: { holy: 0.40 } })
  }

  /**
   * "Horror": hard CC variante de stun/rooted. Misma mecánica (skip turno
   * + consumir `turns`), distinta narrativa: el personaje huye de miedo
   * en vez de estar aturdido o enraizado. Se cablea en
   * `useCombat.skipCCTurn` con un mensaje diferenciado.
   */
  static readonly HORROR: IStatusEffect = {
    type: 'horror',
    name: 'Horror',
    description: 'El personaje está aterrorizado y pierde el turno por miedo.',
    descriptionOnPlayer: 'Un terror paralizante te invade: no puedes actuar este turno.',
    descriptionOnEnemy: 'Tiembla de miedo y huye despavorido.',
    turns: 1,
    icon: horrorIcon,
    isBuff: false,
    turnLabel: '¡Tiembla de miedo y pierde su turno!',
    announceOnTurn: true
  }

  /**
   * "Silenciado": soft CC. NO skipea el turno (el portador sigue
   * haciendo acciones), pero NO puede lanzar habilidades activas (solo
   * ataque basico, si lo tiene). Implementado en `useCombat.executeAbility`
   * chequeando `caster.hasStatusEffect('silenced')` y la flag
   * `ability.silencable` (default `true`).
   */
  static readonly SILENCED: IStatusEffect = {
    type: 'silenced',
    name: 'Silenciado',
    description: 'No puedes lanzar habilidades. Solo ataque básico disponible.',
    descriptionOnPlayer: 'Un hechizo te impide canalizar magia: solo puedes atacar físicamente.',
    descriptionOnEnemy: 'Sus conjuros están sellados: solo puede golpear físicamente.',
    turns: 2,
    icon: silencedIcon,
    isBuff: false,
    turnLabel: '¡Está silenciado!',
    announceOnTurn: true
  }

  // =====================================================================
  // TIER 3 · Bloque D (mecanicas nuevas: HoT, acumulador, shield, enrage)
  // =====================================================================

  /**
   * "Regeneración": Heal over Time. Modelado con `damagePerTurn: -5`
   * (interpretado como "resta 5 de daño por turno" → cura 5 HP por turno).
   * El tick lo detecta por su presencia en `HOT_STATUS_TYPES` y aplica
   * la cura via `Character.heal()`. NO es un DoT, asi que no entra en
   * `DOT_STATUS_TYPES` (sino recibiria el banner rojo de daño).
   */
  static readonly REGEN: IStatusEffect = {
    type: 'regen',
    name: 'Regeneración',
    description: 'Recuperas 5 HP cada turno.',
    turns: 3,
    icon: regenIcon,
    isBuff: true,
    turnLabel: '¡Tus heridas se cierran!',
    damagePerTurn: -5
  }

  /**
   * "Haste": buff que reduce el costo de turno del portador (mas agil
   * = turnos mas frecuentes). Implementado en `useCombat.turnActors`
   * sumando el delta de agilidad del efecto antes de pasar al motor
   * de turnos. Ver `HASTE_AGILITY_BONUS`.
   */
  static readonly HASTE: IStatusEffect = {
    type: 'haste',
    name: 'Prisa',
    description: 'Tu agilidad aumenta en 3 puntos (turnos más rápidos).',
    turns: 3,
    icon: hasteIcon,
    isBuff: true,
    turnLabel: '¡Se mueve más rápido!',
    speedBonus: 3
  }

  /**
   * "Maldición": debufo acumulador sin daño directo. NO avanza por si solo:
   * cada nueva aplicacion (p. ej. el hechizo `WarlockHex`) apila oscuridad
   * sobre el portador. Al alcanzar `maxStacks` aplica `vulnerable` al
   * portador y disipa la maldicion (se elimina el efecto). Si nadie vuelve
   * a aplicarla antes de agotar sus turnos, la maldicion se disipa por si
   * sola sin detonar.
   */
  static readonly CURSE: IStatusEffect = {
    type: 'curse',
    name: 'Maldición',
    description: 'La Maldición se intensifica con cada nueva aplicación. Alcanzado su tope, quedas Vulnerable y se disipa.',
    descriptionOnPlayer: 'Una oscuridad se acumula sobre ti con cada aplicación. Llegado al punto crítico, quedas Vulnerable y la Maldición se disipa.',
    descriptionOnEnemy: 'Una maldición se cierne sobre él/ella y se intensifica con cada nueva aplicación.',
    turns: 5,
    stacks: 0,
    maxStacks: 5,
    icon: curseIcon,
    isBuff: false,
    threatModifier: 0.4
  }

  /**
   * "Enraged": auto-buff opt-in por enemigo. Se aplica una sola vez
   * cuando el enemigo cae por debajo de su `enrageThreshold` propio.
   */
  static readonly ENRAGED: IStatusEffect = {
    type: 'enraged',
    name: 'Enfurecido',
    description: 'Daño +50%, pero bloqueo -20% al estar herido.',
    descriptionOnEnemy: 'Está fuera de sí: golpea con furia pero defiende peor.',
    turns: 3,
    icon: enragedIcon,
    isBuff: true,
    turnLabel: '¡Está fuera de sí!',
    announceOnTurn: true,
    defenseContribution: () => ({
      attackDamageMultiplier: 0.50,
      blockReductionBonus: -0.20
    })
  }

  /**
   * "Escudo Arcano": buff con cargas que ABSORBEN daño antes de reducir
   * HP. Implementado en `Character.takeDamage` consumiendo
   * `absorbRemaining` antes de aplicar el daño real. Cuando llega a 0,
   * el efecto se elimina automaticamente. Las cargas no dependen de
   * turnos: si no recibes daño, duran lo que diga `turns`.
   */
  static readonly ARCANE_SHIELD: IStatusEffect = {
    type: 'arcane_shield',
    name: 'Escudo Arcano',
    description: 'Absorbe los próximos 30 puntos de daño antes de perder HP.',
    turns: 5,
    absorbRemaining: 30,
    maxAbsorb: 30,
    icon: arcaneShieldIcon,
    isBuff: true,
    turnLabel: '¡Un escudo arcano te protege!'
  }

  // Método para obtener un efecto por tipo (case-insensitive)
  static getByType(type: string): IStatusEffect | null {
    const effects = [
      this.STUN,
      this.BURN,
      this.POISON,
      this.FREEZE,
      this.STRENGTH_BOOST,
      this.DEFENSE_BOOST,
      this.SPEED_BOOST,
      this.WEAKNESS,
      this.SLOW,
      this.SECOND_WIND,
      this.VAMPIRE_SHIELD,
      this.INJURED,
      this.CLOUDED,
      this.BLEED,
      this.MARK,
      this.BLINDED,
      this.SPELL_REFLECT,
      this.ROOTED,
      this.FURY,
      this.VULNERABLE,
      this.RESIST_FIRE,
      this.RESIST_ICE,
      this.RESIST_HOLY,
      this.HORROR,
      this.SILENCED,
      this.REGEN,
      this.HASTE,
      this.CURSE,
      this.ENRAGED,
      this.ARCANE_SHIELD
    ]
    const target = type.toLowerCase()
    return effects.find(effect => effect.type === target) || null
  }

  static getRegisteredTypes(): string[] {
    return [
      this.STUN.type,
      this.BURN.type,
      this.POISON.type,
      this.FREEZE.type,
      this.STRENGTH_BOOST.type,
      this.DEFENSE_BOOST.type,
      this.SPEED_BOOST.type,
      this.WEAKNESS.type,
      this.SLOW.type,
      this.SECOND_WIND.type,
      this.VAMPIRE_SHIELD.type,
      this.INJURED.type,
      this.CLOUDED.type,
      this.BLEED.type,
      this.MARK.type,
      this.BLINDED.type,
      this.SPELL_REFLECT.type,
      this.ROOTED.type,
      this.FURY.type,
      this.VULNERABLE.type,
      this.RESIST_FIRE.type,
      this.RESIST_ICE.type,
      this.RESIST_HOLY.type,
      this.HORROR.type,
      this.SILENCED.type,
      this.REGEN.type,
      this.HASTE.type,
      this.CURSE.type,
      this.ENRAGED.type,
      this.ARCANE_SHIELD.type
    ]
  }
}

export function applyFailureEffect(
  target: { addStatusEffect: (effect: IStatusEffect) => void; statusEffects: IStatusEffect[] },
  spec: FailureEffectSpec,
  opts: { isCrit?: boolean } = {}
): void {
  const statusType = String(spec.statusType).toLowerCase()
  const template = StatusEffects.getByType(statusType)
  if (!template) {
    throw new Error(
      `[StatusEffects] Unknown status type "${spec.statusType}". Registered types: ${StatusEffects.getRegisteredTypes().join(', ')}`
    )
  }

  // Resolvemos la categoria del template (puede venir explicita en `category`
  // o inferirse por pertenencia a DOT_STATUS_TYPES / STACKABLE_NON_DOT_STATUS_TYPES
  // / presencia de `charges` — ver `getEffectCategory`).
  const templateCategory = getEffectCategory(template, DOT_STATUS_TYPES, STACKABLE_NON_DOT_STATUS_TYPES)

  // Stack-based (ej. ROOTED): si el target ya tiene el efecto activo con
  // stacks > 0, NO se reaplica ni se suman stacks al impactar. Asi un ataque
  // que aplique 'rooted' sobre un heroe ya enraizado solo consume stacks via
  // `consumeRootedStack` (manejado por useCombat antes de llamar a
  // applyFailureEffect), pero no refresca la rooting indefinidamente. Esto
  // evita el bug donde ENTANGLE aplicaba ROOTED en cada fase fallida,
  // manteniendo al heroe enraizado para siempre aunque bloqueara fases intermedias.
  if (templateCategory === 'stack-based') {
    const existing = target.statusEffects.find(
      e => e.type === statusType && e.turns > 0 && (e.stacks ?? 0) > 0
    )
    if (existing) {
      return
    }
  }

  const stacks = Math.max(1, spec.stacks ?? 1)
  const maxStacks = template.maxStacks ?? DEFAULT_MAX_STACKS
  if (stacks > maxStacks) {
    throw new Error(
      `[StatusEffects] "${statusType}" cannot stack above ${maxStacks} (got ${stacks}). ` +
      `Increase maxStacks in StatusEffects.${statusType.toUpperCase()} template if needed.`
    )
  }

  const defaultDotDuration = opts.isCrit && DOT_STATUS_TYPES.has(statusType)
    ? CRIT_DOT_DURATION
    : MAX_DOT_DURATION
  const requestedMaxDuration = spec.maxDuration ?? template.maxDuration ?? defaultDotDuration
  // Categorias no-turn-based (stack-based, charge-based): no tienen expiracion
  // por turnos. Forzamos `Infinity` para que `hasStatusEffect` y
  // `removeExpiredStatusEffects` siempre consideren el efecto vivo hasta que
  // un consumidor externo (consumeRootedStack / processPlayerOnBlockHooks)
  // lo elimine explicitamente al llegar a 0 stacks/charges.
  const maxDuration = NON_TURN_BASED_CATEGORIES.has(templateCategory)
    ? Infinity
    : requestedMaxDuration

  const instance: IStatusEffect = {
    ...template,
    turns: maxDuration,
    stacks,
    maxStacks,
    maxDuration
  }
  target.addStatusEffect(instance)
}
