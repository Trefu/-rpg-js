import { IClass } from '../interfaces/IClass'
import type { IAbility, AbilityContext } from '../interfaces/IAbility'

export class Rogue implements IClass {
  public readonly name = 'Rogue'
  public readonly description = 'Un maestro del sigilo y los ataques precisos.'
  
  public readonly baseStats = {
    fuerza: 8,
    destreza: 18,
    inteligencia: 6,
    sabiduria: 8,
    constitucion: 10,
    carisma: 12
  }

  public readonly levelUpStats = {
    fuerza: 2,
    destreza: 5,
    inteligencia: 2,
    sabiduria: 2,
    constitucion: 2,
    carisma: 3
  }

  public readonly baseAttackAbility: IAbility = {
    name: 'Atacar',
    description: 'Un ataque básico con daño completo.',
    type: 'attack',
    cooldown: 0,
    execute: async ({ caster, target, addToLog, showEnemyHit, endPlayerTurn, performTimingChallenge, audioManager }: AbilityContext) => {
      audioManager.playAttackSound()
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
        audioManager.playHitSound()
      } else {
        addToLog(`${caster.name} falla el ataque.`)
      }
      
      endPlayerTurn()
    }
  }

  public readonly abilities: IAbility[] = [
    {
      name: 'Golpe Sigiloso',
      description: 'Un ataque furtivo que causa daño crítico si el timing es perfecto.',
      type: 'stealthStrike',
      cooldown: 2,
      execute: async ({ caster, target, addToLog, showEnemyHit, endPlayerTurn, performTimingChallenge, audioManager }: AbilityContext) => {
        audioManager.playAttackSound()
        const timingResult = await performTimingChallenge()
        
        let damageMultiplier = 1.0
        if (timingResult === 'perfect') damageMultiplier = 2.5 // Crítico para rogue
        if (timingResult === 'good') damageMultiplier = 1.3
        if (timingResult === 'bad') damageMultiplier = 0.7
        if (timingResult === 'miss') damageMultiplier = 0
        
        const finalDamage = Math.round(caster.attack() * damageMultiplier)
        
        if (finalDamage > 0) {
          target.takeDamage(finalDamage)
          if (timingResult === 'perfect') {
            addToLog(`${caster.name} realiza un golpe sigiloso crítico e inflige ${finalDamage} de daño!`)
          } else {
            addToLog(`${caster.name} realiza un golpe sigiloso e inflige ${finalDamage} de daño.`)
          }
          showEnemyHit(target.id, finalDamage)
          audioManager.playHitSound()
        } else {
          addToLog(`${caster.name} falla el golpe sigiloso.`)
        }
        
        endPlayerTurn()
      }
    }
  ]
} 