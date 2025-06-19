import { defineStore } from 'pinia'
import type { Player } from '../core/Player'

export type GameLocation = 'class-selector' | 'city' | 'expedition' | 'shop' | 'expedition-map' | 'combat' | 'training'

interface GameState {
  player: Player | null
  currentLevel: number
  currentScore: number
  isGameStarted: boolean
  currentLocation: GameLocation
  gold: number
  experience: number
}

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    player: null,
    currentLevel: 1,
    currentScore: 0,
    isGameStarted: false,
    currentLocation: 'class-selector',
    gold: 0,
    experience: 0
  }),

  actions: {
    setPlayer(character: Player) {
      this.player = character
      this.isGameStarted = true
      this.currentLocation = 'city'
    },

    updateScore(points: number) {
      this.currentScore += points
    },

    levelUp() {
      this.currentLevel++
    },

    addGold(amount: number) {
      this.gold += amount
    },

    addExperience(amount: number) {
      this.experience += amount
      // TODO: Implementar lógica de subida de nivel basada en experiencia
    },

    navigateTo(location: GameLocation) {
      this.currentLocation = location
    },

    resetGame() {
      this.player = null
      this.currentLevel = 1
      this.currentScore = 0
      this.isGameStarted = false
      this.currentLocation = 'class-selector'
      this.gold = 0
      this.experience = 0
    }
  }
}) 