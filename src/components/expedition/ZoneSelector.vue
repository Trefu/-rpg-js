<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '@/stores/game'
import { useExpeditionStore } from '@/stores/expedition'
import type { IZone } from '@/core/interfaces/IExpedition'
import { zones } from '@/core/zones/Zones'

const selectedZone = ref<IZone | null>(null)
const expeditionStore = useExpeditionStore()
const gameStore = useGameStore()

const mountainZone = zones.find(z => z.id === 'mountain-peak')
const availableZones = mountainZone ? [mountainZone] : []

const selectZone = (zone: IZone) => {
  selectedZone.value = zone
  expeditionStore.startExpedition(zone)
  gameStore.navigateTo('expedition-map')
}
</script>

<template>
  <div class="zone-selector">
    <h2>Selecciona una Zona</h2>
    <div class="zones-grid">
      <div
        v-for="zone in availableZones"
        :key="zone.id"
        class="zone-card"
        :class="{ selected: selectedZone?.id === zone.id }"
        @click="selectZone(zone)"
      >
        <div class="zone-header">
          <h3>{{ zone.name }}</h3>
          <span class="difficulty" :class="zone.difficulty">
            {{ zone.difficulty }}
          </span>
        </div>
        <p>{{ zone.description }}</p>
        <div class="zone-details">
          <div class="requirement">
            <span>Nivel mínimo: {{ zone.minLevel }}</span>
          </div>
          <div class="rewards">
            <span>Recompensas:</span>
            <ul>
              <li>Experiencia: {{ zone.rewards.experience }}</li>
              <li>Oro: {{ zone.rewards.gold }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.zone-selector {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.zones-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.zone-card {
  background-color: #2a2a2a;
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.zone-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.zone-card.selected {
  border: 2px solid #4CAF50;
}

.zone-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.zone-header h3 {
  margin: 0;
  color: #4CAF50;
}

.difficulty {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
  text-transform: capitalize;
}

.difficulty.easy {
  background-color: #4CAF50;
}

.difficulty.medium {
  background-color: #FFC107;
  color: #000;
}

.difficulty.hard {
  background-color: #f44336;
}

.zone-details {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #3a3a3a;
}

.requirement {
  margin-bottom: 0.5rem;
  color: #888;
}

.rewards {
  color: #4CAF50;
}

.rewards ul {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0;
}

.rewards li {
  margin: 0.25rem 0;
}
</style> 