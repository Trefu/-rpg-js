import type { IAbility } from '@/core/interfaces/IAbility'
import type { AbilityContext } from '@/core/interfaces/IAbility'

export const createBasicAttackAbility = (): IAbility => ({
  name: 'Ataque Básico',
  description: 'Un ataque simple con daño bajo',
  type: 'attack',
  cooldown: 0,
  damage: 30,
  execute: async (context: AbilityContext) => {
    const baseDamage = context.caster.attack()
    const multiplier = context.damageMultiplier ?? 1
    const finalDamage = Math.floor(baseDamage * multiplier)
    context.showEnemyHit(context.target.id, finalDamage)
    context.addToLog(`Usaste Ataque Básico causando ${finalDamage} de daño.`)
  }
})

export const createStunStrikeAbility = (): IAbility => ({
  name: 'Golpe Aturdidor',
  description: 'Un golpe que puede aturdir al enemigo',
  type: 'stunStrike',
  cooldown: 3,
  damage: 50,
  execute: async (context: AbilityContext) => {
    const damage = Math.floor(context.caster.attack() * 0.8)
    context.showEnemyHit(context.target.id, damage)
    context.addToLog(`Usaste Golpe Aturdidor causando ${damage} de daño.`)
  }
})

export const createStealthStrikeAbility = (): IAbility => ({
  name: 'Golpe Sigiloso',
  description: 'Ataque furtivo que hace más daño',
  type: 'stealthStrike',
  cooldown: 2,
  damage: 70,
  execute: async (context: AbilityContext) => {
    const damage = Math.floor(context.caster.attack() * 1.5)
    context.showEnemyHit(context.target.id, damage)
    context.addToLog(`Usaste Golpe Sigiloso causando ${damage} de daño.`)
  }
})

export const createFireballAbility = (): IAbility => ({
  name: 'Bola de Fuego',
  description: 'Hechizo de fuego que causa daño mágico',
  type: 'fireball',
  cooldown: 3,
  damage: 90,
  execute: async (context: AbilityContext) => {
    const damage = context.caster.magic() + 30
    context.showEnemyHit(context.target.id, damage)
    context.addToLog(`Lanzaste Bola de Fuego causando ${damage} de daño de fuego.`)
  }
})