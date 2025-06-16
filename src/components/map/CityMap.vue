<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'goToShop'): void
  (e: 'goToExpedition'): void
}>()

const locations = [
  {
    id: 'shop',
    name: 'Tienda',
    description: 'Compra equipo y pociones',
    icon: '🏪'
  },
  {
    id: 'expedition',
    name: 'Expedición',
    description: 'Explora zonas peligrosas',
    icon: '🗺️'
  }
]

const selectedLocation = ref<string | null>(null)

const selectLocation = (locationId: string) => {
  selectedLocation.value = locationId
  if (locationId === 'shop') {
    emit('goToShop')
  } else if (locationId === 'expedition') {
    emit('goToExpedition')
  }
}
</script>

<template>
  <div class="city-map">
    <h2>Ciudad Principal</h2>
    <div class="locations">
      <div
        v-for="location in locations"
        :key="location.id"
        class="location-card"
        :class="{ selected: selectedLocation === location.id }"
        @click="selectLocation(location.id)"
      >
        <div class="location-icon">{{ location.icon }}</div>
        <div class="location-info">
          <h3>{{ location.name }}</h3>
          <p>{{ location.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.city-map {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.locations {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.location-card {
  background-color: #2a2a2a;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.location-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.location-card.selected {
  border: 2px solid #4CAF50;
}

.location-icon {
  font-size: 2.5rem;
  background-color: #333;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.location-info h3 {
  margin: 0;
  color: #4CAF50;
}

.location-info p {
  margin: 0.5rem 0 0;
  color: #888;
}
</style> 