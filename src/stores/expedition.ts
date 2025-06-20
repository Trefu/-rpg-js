import { defineStore } from 'pinia'
import type { IExpedition, INode, IZone } from '@/core/interfaces/IExpedition'
import { useExpeditionGenerator } from '@/composables/useExpeditionGenerator'

interface ExpeditionState {
  currentExpedition: IExpedition | null
  selectedNode: INode | null
}

export const useExpeditionStore = defineStore('expedition', {
  state: (): ExpeditionState => ({
    currentExpedition: null,
    selectedNode: null
  }),

  actions: {
    startExpedition(zone: IZone) {
      const { generateExpeditionNodes } = useExpeditionGenerator()
      const nodes = generateExpeditionNodes(zone)
      
      this.currentExpedition = {
        zone,
        nodes,
        currentNode: null,
        completed: false
      }
      
      // Establecer el nodo inicial como disponible
      this.selectedNode = nodes.find(node => node.id === 'start') || null
    },

    selectNode(node: INode) {
      if (this.currentExpedition) {
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
      }
    },

    resetExpedition() {
      this.currentExpedition = null
      this.selectedNode = null
    }
  },

  getters: {
    availableNodes: (state): string[] => {
      if (!state.currentExpedition || !state.selectedNode) return ['start']
      return state.selectedNode.connections
    },
    
    isExpeditionActive: (state): boolean => {
      return state.currentExpedition !== null
    }
  }
}) 