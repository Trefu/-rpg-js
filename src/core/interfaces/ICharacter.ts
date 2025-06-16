export interface ICharacter {
  name: string
  health: number
  maxHealth: number
  attack: number | (() => number)
  defense: number | (() => number)
  magic: number | (() => number)
  specialAbility: {
    name: string
    description: string
  }
}

export interface ICombatant extends ICharacter {
  attack: () => number
  defense: () => number
  magic: () => number
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