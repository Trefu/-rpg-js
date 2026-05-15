import { defineStore } from 'pinia'
import type { Player } from '../core/Player'

export type GameLocation = 'expedition-map' | 'combat' | 'shop' | 'city'

interface GameState {
  player: Player | null
  isGameStarted: boolean
  currentLocation: GameLocation
  gold: number
  experience: number
}

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    player: null,
    isGameStarted: false,
    currentLocation: 'city',
    gold: 0,
    experience: 0
  }),

  actions: {
    startGame(player: Player) {
      this.player = player
      this.isGameStarted = true
      this.currentLocation = 'city'
    },

    navigateTo(location: GameLocation) {
      this.currentLocation = location
    },

    resetGame() {
      this.player = null
      this.isGameStarted = false
      this.currentLocation = 'city'
      this.gold = 0
      this.experience = 0
    }
  }
})