<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Loader } from '@/core/Loader'
import type { IClass } from '@/core/interfaces/IClass'


const emit = defineEmits<{
  (e: 'classSelected', className: string): void
}>()

const loader = Loader.getInstance()
const classes = ref<IClass[]>([])
const selectedClass = ref<IClass | null>(null)
const loading = ref(true)


onMounted(async () => {
  try {
    await loader.load()
    classes.value = loader.getAvailableClasses()
  } catch (error) {
    console.error('Error loading classes:', error)
  } finally {
    loading.value = false
  }
})

const selectClass = (characterClass: IClass) => {
  selectedClass.value = characterClass
  emit('classSelected', characterClass.name.toLowerCase())
}
</script>

<template>
  <div class="class-selector">
    <div v-if="loading" class="loading">
      <div class="loading-bar">
        <div
          class="loading-progress"
          :style="{ width: `${loader.getLoadingProgress()}%` }"
        ></div>
      </div>
      <p>Cargando recursos del juego...</p>
    </div>

    <div v-else class="classes">
      <h2>Selecciona tu clase</h2>
      <div class="class-grid">
        <div
          v-for="characterClass in classes"
          :key="characterClass.name"
          class="class-card"
          :class="{ selected: selectedClass?.name === characterClass.name }"
          @click="selectClass(characterClass)"
        >
          <h3>{{ characterClass.name }}</h3>
          <p>{{ characterClass.description }}</p>
          <div class="stats">
            <h4>Estadísticas base:</h4>
            <ul>
              <li>Vida: {{ characterClass.baseStats.health }}</li>
              <li>Ataque: {{ characterClass.baseStats.attack }}</li>
              <li>Defensa: {{ characterClass.baseStats.defense }}</li>
              <li>Magia: {{ characterClass.baseStats.magic }}</li>
            </ul>
          </div>
          <div class="ability">
            <h4>Habilidad especial:</h4>
            <p>{{ characterClass.specialAbility.name }}</p>
            <small>{{ characterClass.specialAbility.description }}</small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.class-selector {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.loading {
  text-align: center;
  padding: 2rem;
}

.loading-bar {
  width: 100%;
  height: 20px;
  background-color: #2a2a2a;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.loading-progress {
  height: 100%;
  background-color: #4CAF50;
  transition: width 0.3s ease;
}

.class-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.class-card {
  background-color: #2a2a2a;
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.class-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.class-card.selected {
  border: 2px solid #4CAF50;
}

.stats, .ability {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #3a3a3a;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0;
}

li {
  margin: 0.25rem 0;
}

small {
  color: #888;
  display: block;
  margin-top: 0.5rem;
}
</style> 