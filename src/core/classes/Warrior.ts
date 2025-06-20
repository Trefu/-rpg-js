import { IClass } from '../interfaces/IClass'
import type { IAbility, AbilityContext } from '../interfaces/IAbility'
import type { IStatusEffect } from '../interfaces/IStatusEffect'

export class Warrior implements IClass {
  public readonly name = 'Warrior'
  public readonly description = 'Un guerrero experto en combate cuerpo a cuerpo y defensa.'
  
  public readonly baseStats = {
    fuerza: 10,
    destreza: 15,
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
      execute: async ({ caster, target, addToLog, showEnemyHit, endPlayerTurn, performTimingChallenge }: AbilityContext) => {
        const timingResult = await performTimingChallenge()
        
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
      description: 'Lanza 3 ataques rápidos. Cada uno inflige un 20% de daño y tiene un 50% de probabilidad de aturdir al objetivo si el golpe es bueno o perfecto.',
      type: 'stunStrike',
      cooldown: 3,
      execute: async ({ caster, target, addToLog, showEnemyHit, endPlayerTurn, performTimingChallenge }: AbilityContext) => {
        for (let i = 0; i < 3; i++) {
          if (!target.isAlive) break

          addToLog(`Golpe ${i + 1} de 3...`)
          const timingResult = await performTimingChallenge()

          if (timingResult === 'miss') {
            addToLog('¡Fallado!')
            continue
          }

          // Calcular daño basado en el timing
          let damageMultiplier = 0.2 // 20% base para timing malo
          if (timingResult === 'good') damageMultiplier = 0.3 // 30% para timing bueno (+50%)
          if (timingResult === 'perfect') damageMultiplier = 0.4 // 40% para timing perfecto (+100%)
          
          const finalDamage = Math.round(caster.attack() * damageMultiplier)

          target.takeDamage(finalDamage)
          addToLog(`Infliges ${finalDamage} de daño.`)
          showEnemyHit(target.id, finalDamage)

          if (timingResult === 'perfect' || timingResult === 'good') {
            if (Math.random() < 0.9) {
              // Buscar si ya existe un efecto de stun
              const existingStun = target.statusEffects.find(e => e.type === 'stun')
              
              if (existingStun) {
                // Si ya hay stun, añadir 1 turno más
                existingStun.turns += 2
                addToLog(`¡${target.name} ha sido aturdido por ${existingStun.turns} turno(s)!`)
              } else {
                // Si no hay stun, crear uno nuevo
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
                addToLog(`¡${target.name} ha sido aturdido!`)
              }
            } else {
              addToLog('El aturdimiento falló.')
            }
          }
        }
        
        endPlayerTurn()
      }
    }
  ]
} 