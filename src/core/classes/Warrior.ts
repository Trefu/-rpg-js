import { IClass } from '../interfaces/IClass'
import type { IAbility, AbilityContext } from '../interfaces/IAbility'
import type { IStatusEffect } from '../interfaces/IStatusEffect'

export class Warrior implements IClass {
  public readonly name = 'Warrior'
  public readonly description = 'Un guerrero experto en combate cuerpo a cuerpo y defensa.'
  
  public readonly baseStats = {
    fuerza: 10,
    destreza: 5,
    inteligencia: 5,
    sabiduria: 10,
    constitucion: 14,
    carisma: 8
  }

  public readonly levelUpStats = {
    fuerza: 4,
    destreza: 1,
    inteligencia: 1,
    sabiduria: 1,
    constitucion: 3,
    carisma: 1
  }

  public readonly specialAbility = {
    name: 'Berserker Rage',
    description: 'Aumenta el ataque y la velocidad durante 3 turnos.',
    cooldown: 5
  }

  public readonly abilities: IAbility[] = [
    {
      name: 'Atacar',
      description: 'Un ataque básico con daño completo.',
      type: 'attack',
      cooldown: 0,
      execute: ({ caster, target, addToLog, showEnemyHit, timingResult, endPlayerTurn }: AbilityContext) => {
        let damageMultiplier = 1.0
        if (timingResult === 'perfect') damageMultiplier = 1.5
        if (timingResult === 'good') damageMultiplier = 1.0
        if (timingResult === 'bad') damageMultiplier = 0.5
        if (timingResult === 'miss') damageMultiplier = 0
        
        const finalDamage = Math.round(caster.attack() * damageMultiplier)
        
        if (finalDamage > 0) {
          target.takeDamage(finalDamage)
          addToLog(`${caster.name} ataca e inflige ${finalDamage} de daño.`)
          showEnemyHit(target.id, finalDamage)
        } else {
          addToLog(`${caster.name} falla el ataque.`)
        }
        
        endPlayerTurn()
      }
    },
    {
      name: 'Golpe Aturdidor',
      description: 'Inflige 80% de daño y puede aturdir al enemigo.',
      type: 'stunStrike',
      cooldown: 3,
      execute: ({ caster, target, addToLog, showEnemyHit, timingResult, endPlayerTurn }: AbilityContext) => {
        const baseDamage = Math.round(caster.attack() * 0.8)
        
        if (timingResult === 'perfect' || timingResult === 'good') {
          target.takeDamage(baseDamage)
          addToLog(`${caster.name} usa Golpe Aturdidor e inflige ${baseDamage} de daño.`)
          showEnemyHit(target.id, baseDamage)
          
          const stunEffect: IStatusEffect = {
            type: 'stun',
            name: 'Stun',
            description: 'El personaje no puede realizar acciones.',
            turns: 1,
            icon: '/src/assets/icons/Splash icons/35.png',
            isBuff: false,
            turnLabel: '¡Está aturdido y pierde su turno!'
          }
          target.addStatusEffect(stunEffect)
          addToLog(`${target.name} ha sido aturdido.`)
          
        } else {
          addToLog(`${caster.name} falla su Golpe Aturdidor.`)
        }
        
        endPlayerTurn()
      }
    }
  ]
} 