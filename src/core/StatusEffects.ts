import type { IStatusEffect } from './interfaces/IStatusEffect'
import stunIcon from '@/assets/icons/ball-glow.png'
import burnIcon from '@/assets/icons/fire.png'
import poisonIcon from '@/assets/icons/poison-gas.png'
import strengthIcon from '@/assets/icons/muscle-up.png'
import defenseIcon from '@/assets/icons/shield.png'
import speedIcon from '@/assets/icons/footprint.png'
import weaknessIcon from '@/assets/icons/anatomy.png'
import slowIcon from '@/assets/icons/snail.png'

export class StatusEffects {
  // Efectos de aturdimiento
  static readonly STUN: IStatusEffect = {
    type: 'stun',
    name: 'Aturdido',
    description: 'El personaje no puede realizar acciones.',
    turns: 1,
    icon: stunIcon,
    isBuff: false,
    turnLabel: '¡Está aturdido y pierde su turno!'
  }

  static readonly STUN_EXTENDED: IStatusEffect = {
    type: 'stun',
    name: 'Aturdido Extendido',
    description: 'El personaje no puede realizar acciones por múltiples turnos.',
    turns: 2,
    icon: stunIcon,
    isBuff: false,
    turnLabel: '¡Está aturdido y pierde su turno!'
  }

  // Efectos de daño por tiempo
  static readonly BURN: IStatusEffect = {
    type: 'burn',
    name: 'Quemado',
    description: 'El personaje recibe daño por tiempo.',
    turns: 3,
    icon: burnIcon,
    isBuff: false,
    turnLabel: '¡Recibe daño por quemadura!',
    damagePerTurn: 5
  }

  static readonly POISON: IStatusEffect = {
    type: 'poison',
    name: 'Envenenado',
    description: 'El personaje recibe daño por veneno.',
    turns: 4,
    icon: poisonIcon,
    isBuff: false,
    turnLabel: '¡Recibe daño por veneno!',
    damagePerTurn: 3
  }

  // Efectos de buff
  static readonly STRENGTH_BOOST: IStatusEffect = {
    type: 'strength_boost',
    name: 'Fuerza Aumentada',
    description: 'Aumenta el ataque del personaje.',
    turns: 3,
    icon: strengthIcon,
    isBuff: true,
    turnLabel: '¡Su fuerza está aumentada!',
    attackBonus: 5
  }

  static readonly DEFENSE_BOOST: IStatusEffect = {
    type: 'defense_boost',
    name: 'Defensa Aumentada',
    description: 'Aumenta la defensa del personaje.',
    turns: 3,
    icon: defenseIcon,
    isBuff: true,
    turnLabel: '¡Su defensa está aumentada!',
    defenseBonus: 3
  }

  static readonly SPEED_BOOST: IStatusEffect = {
    type: 'speed_boost',
    name: 'Velocidad Aumentada',
    description: 'Aumenta la velocidad del personaje.',
    turns: 2,
    icon: speedIcon,
    isBuff: true,
    turnLabel: '¡Su velocidad está aumentada!',
    speedBonus: 2
  }

  // Efectos de debuff
  static readonly WEAKNESS: IStatusEffect = {
    type: 'weakness',
    name: 'Debilitado',
    description: 'Reduce el ataque del personaje.',
    turns: 2,
    icon: weaknessIcon,
    isBuff: false,
    turnLabel: '¡Está debilitado!',
    attackPenalty: -3
  }

  static readonly SLOW: IStatusEffect = {
    type: 'slow',
    name: 'Ralentizado',
    description: 'Reduce la velocidad del personaje.',
    turns: 2,
    icon: slowIcon,
    isBuff: false,
    turnLabel: '¡Está ralentizado!',
    speedPenalty: -1
  }

  // Métodos de utilidad para crear efectos con duración personalizada
  static createStun(turns: number = 1): IStatusEffect {
    return {
      ...this.STUN,
      turns
    }
  }

  static createBurn(turns: number = 3, damagePerTurn: number = 5): IStatusEffect {
    return {
      ...this.BURN,
      turns,
      damagePerTurn
    }
  }

  static createPoison(turns: number = 4, damagePerTurn: number = 3): IStatusEffect {
    return {
      ...this.POISON,
      turns,
      damagePerTurn
    }
  }

  static createStrengthBoost(turns: number = 3, attackBonus: number = 5): IStatusEffect {
    return {
      ...this.STRENGTH_BOOST,
      turns,
      attackBonus
    }
  }

  static createDefenseBoost(turns: number = 3, defenseBonus: number = 3): IStatusEffect {
    return {
      ...this.DEFENSE_BOOST,
      turns,
      defenseBonus
    }
  }

  // Método para obtener un efecto por tipo
  static getByType(type: string): IStatusEffect | null {
    const effects = [
      this.STUN,
      this.BURN,
      this.POISON,
      this.STRENGTH_BOOST,
      this.DEFENSE_BOOST,
      this.SPEED_BOOST,
      this.WEAKNESS,
      this.SLOW
    ]
    
    return effects.find(effect => effect.type === type) || null
  }
}