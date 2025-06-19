export interface ICharacter {
  readonly id: string
  name: string
  health: number
  maxHealth: number
  isAlive: boolean
  attack: number | (() => number)
  defense: number | (() => number)
  magic: number | (() => number)
  specialAbility: {
    name: string
    description: string
  }
}

export interface IPlayerStats {
  fuerza: number
  destreza: number
  inteligencia: number
  sabiduria: number
  constitucion: number
  carisma: number
}

export interface IStatusEffect {
  type: string // 'stun', 'poison', etc.
  name: string
  icon: string // ruta al icono
  turns: number
  description: string
  isBuff?: boolean // true si es positivo
  turnLabel?: string // texto que se muestra en el turno del portador
}

export interface ICombatant extends ICharacter {
  attack: () => number
  defense: () => number
  magic: () => number
  takeDamage(amount: number): void
  heal(amount: number): void
  statusEffects: IStatusEffect[]
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

export interface IEnemy extends ICombatant {
  getRewards(): { experience: number; gold: number }
  delayMs?: number
  stunTurns?: number
  isStunned?(): boolean
  reduceStun?(): void
  addStatusEffect?(effect: IStatusEffect): void
  reduceStatusEffects?(): void
} 