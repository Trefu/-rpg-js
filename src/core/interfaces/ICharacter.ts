export interface ICharacter {
  id: string
  name: string
  level: number
  health: number
  maxHealth: number
  isAlive: boolean
}

export interface ICombatant extends ICharacter {
  attack(): number
  takeDamage(amount: number): void
  heal(amount: number): void
}

export interface ILevelable extends ICharacter {
  experience: number
  experienceToNextLevel: number
  levelUp(): void
  gainExperience(amount: number): void
}

export interface IInventory {
  gold: number
  items: string[]
  addItem(item: string): void
  removeItem(item: string): void
  addGold(amount: number): void
  spendGold(amount: number): boolean
} 