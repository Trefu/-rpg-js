import { IClass } from '../interfaces/IClass'
import type { IAbility, AbilityContext } from '../interfaces/IAbility'

export class Wizard implements IClass {
  public readonly name = 'Wizard'
  public readonly description = 'Un poderoso hechicero que domina las artes arcanas.'
  
  public readonly baseStats = {
    fuerza: 4,
    destreza: 8,
    inteligencia: 18,
    sabiduria: 16,
    constitucion: 8,
    carisma: 10
  }

  public readonly levelUpStats = {
    fuerza: 1,
    destreza: 1,
    inteligencia: 6,
    sabiduria: 5,
    constitucion: 2,
    carisma: 2
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
      name: 'Bola de Fuego',
      description: 'Lanza una bola de fuego mágica que causa daño mágico.',
      type: 'fireball',
      cooldown: 2,
      execute: async ({ caster, target, addToLog, showEnemyHit, endPlayerTurn, performTimingChallenge, audioManager }: AbilityContext) => {
        audioManager.playAttackSound()
        const timingResult = await performTimingChallenge()
        
        let damageMultiplier = 1.0
        if (timingResult === 'perfect') damageMultiplier = 2.0
        if (timingResult === 'good') damageMultiplier = 1.5
        if (timingResult === 'bad') damageMultiplier = 0.8
        if (timingResult === 'miss') damageMultiplier = 0
        
        // Los magos usan magia para el daño
        const finalDamage = Math.round(caster.magic() * damageMultiplier)
        
        if (finalDamage > 0) {
          target.takeDamage(finalDamage)
          addToLog(`${caster.name} lanza una bola de fuego e inflige ${finalDamage} de daño mágico.`)
          showEnemyHit(target.id, finalDamage)
          audioManager.playHitSound()
        } else {
          addToLog(`${caster.name} falla el hechizo de bola de fuego.`)
        }
        
        endPlayerTurn()
      }
    }
  ]
} 