import { IClass } from '../interfaces/IClass'
import type { IAbility, AbilityContext } from '../interfaces/IAbility'
import { StatusEffects } from '../StatusEffects'

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
      name: 'Golpe Aturdidor',
      description: 'Lanza 3 ataques rápidos. Cada uno inflige un 20% de daño. Si el golpe es bueno o perfecto, tiene 100% de probabilidad de aturdir (reducida en 30% por cada stun existente).',
      type: 'stunStrike',
      cooldown: 3,
      execute: async ({ caster, target, addToLog, showEnemyHit, endPlayerTurn, performTimingChallenge, audioManager }: AbilityContext) => {
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
          audioManager.playHitSound()

          if (timingResult === 'perfect' || timingResult === 'good') {
            // Buscar si ya existe un efecto de stun
            const existingStun = target.statusEffects.find(e => e.type === 'stun')
            
            // Calcular probabilidad de stun: 100% base, -30% por cada stun existente
            let stunChance = 1.0 // 100%
            if (existingStun) {
              stunChance = Math.max(0.1, 1.0 - (existingStun.turns * 0.3)) // Mínimo 10% de probabilidad
            }
            
            if (Math.random() < stunChance) {
              if (existingStun) {
                // Si ya hay stun, añadir 1 turno más
                existingStun.turns += 1
                addToLog(`¡${target.name} ha sido aturdido por ${existingStun.turns} turno(s)!`)
              } else {
                // Usar el efecto predefinido
                const stunEffect = StatusEffects.createStun(1)
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