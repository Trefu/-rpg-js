import { defineStore } from 'pinia'
import type { IExpedition, INode } from '@/core/interfaces/IExpedition'
import type { ExpeditionId, IExpeditionConfig } from '@/core/expeditions/types'
import { useExpeditionGenerator } from '@/composables/useExpeditionGenerator'
import {
  DEFAULT_EXPEDITION,
  EXPEDITIONS,
  getExpedition
} from '@/core/expeditions/registry'
import { SHARED_CURIOSITY_EVENTS } from '@/core/expeditions/sharedCuriosityEvents'
import type { CuriosityEvent } from '@/core/events/curiosityEvents'

interface ExpeditionState {
  currentExpedition: IExpedition | null
  selectedNode: INode | null
  /** Set de expedition ids ya completadas en esta sesion (no persistido). */
  completedExpeditions: Set<ExpeditionId>
  currentRunAttempt: number
  resolvedEventIds: string[]
}

export const useExpeditionStore = defineStore('expedition', {
  state: (): ExpeditionState => ({
    currentExpedition: null,
    selectedNode: null,
    completedExpeditions: new Set<ExpeditionId>(),
    currentRunAttempt: 0,
    resolvedEventIds: []
  }),

  getters: {
    currentConfig: (state): IExpeditionConfig | null => {
      return state.currentExpedition?.config ?? null
    },
    availableNodes: (state): string[] => {
      if (!state.currentExpedition || !state.selectedNode) return ['start']
      const start = state.currentExpedition.nodes.find(n => n.id === 'start')
      if (start && !start.completed) return ['start']
      const connected = state.selectedNode.connections
      const gate = state.currentExpedition.config.generator.progressionGate
      if (!gate) return connected
      return connected.filter(id => id !== gate.nodeId || state.currentRunAttempt >= gate.minimumAttempts)
    },
    isExpeditionActive: (state): boolean => {
      return state.currentExpedition !== null
    },
    /**
     * Eventos de curiosidad disponibles para la expedicion actual.
     * Si la config declara `curiosityEvents`, gana; si no, se usa el
     * catalogo compartido.
     */
    activeCuriosityEvents: (state): CuriosityEvent[] => {
      return (state.currentExpedition?.config.curiosityEvents
        ?? SHARED_CURIOSITY_EVENTS).filter(event => !event.uniquePerRun || !state.resolvedEventIds.includes(event.id))
    }
  },

  actions: {
    startExpedition(expeditionId: ExpeditionId = DEFAULT_EXPEDITION, recruitedHeroClassIds: string[] = [], runAttempt = 0) {
      this.currentRunAttempt = runAttempt
      if (!EXPEDITIONS[expeditionId]) {
        console.warn(
          `[expedition] expedition "${expeditionId}" no existe. Falling back to ${DEFAULT_EXPEDITION}.`
        )
        expeditionId = DEFAULT_EXPEDITION
      }
      const config = getExpedition(expeditionId)

      if (!this.isExpeditionUnlocked(expeditionId)) {
        console.warn(
          `[expedition] expedition "${expeditionId}" is locked. Falling back to ${DEFAULT_EXPEDITION}.`
        )
        const fallback = getExpedition(DEFAULT_EXPEDITION)
        this.beginExpeditionWith(fallback, recruitedHeroClassIds)
        return
      }

      try {
        this.beginExpeditionWith(config, recruitedHeroClassIds)
      } catch (err) {
        console.error('[expedition] failed to start expedition', err)
        this.resetExpedition()
      }
    },

    beginExpeditionWith(config: IExpeditionConfig, recruitedHeroClassIds: string[] = []) {
      this.resolvedEventIds = []
      const { generateExpeditionNodes } = useExpeditionGenerator()
      const nodes = generateExpeditionNodes(config, { recruitedHeroClassIds })
      const startNode = nodes.find(node => node.id === 'start') || null

      this.currentExpedition = {
        config,
        nodes,
        currentNode: startNode,
        completed: false
      }
      this.selectedNode = startNode
    },

    isExpeditionUnlocked(id: ExpeditionId): boolean {
      const cfg = EXPEDITIONS[id]
      if (!cfg) return false
      if (cfg.unlockCriteria.kind === 'always') return true
      return cfg.unlockCriteria.expeditions.every(req =>
        this.completedExpeditions.has(req)
      )
    },

    selectNode(node: INode) {
      if (this.currentExpedition) {
        const gate = this.currentExpedition.config.generator.progressionGate
        if (gate && node.id === gate.nodeId && this.currentRunAttempt < gate.minimumAttempts) return
        this.selectedNode = node
        this.currentExpedition.currentNode = node
      }
    },

    completeNode(nodeId: string) {
      if (!this.currentExpedition) return
      const node = this.currentExpedition.nodes.find(n => n.id === nodeId)
      if (node) {
        node.completed = true
      }
    },

    completeExpedition() {
      if (this.currentExpedition) {
        this.currentExpedition.completed = true
        this.completedExpeditions.add(this.currentExpedition.config.id)
      }
    },

    resetExpedition() {
      this.currentExpedition = null
      this.selectedNode = null
    }
  }
})
