<script setup lang="ts">
import { computed } from 'vue'
import type { IPlayerStats } from '@/core/interfaces/ICharacter'
import type { Player } from '@/core/Player'

export interface PlayerDerivedStat {
  key: string
  label: string
  icon: string
  value: number
  hint?: string
}

const props = defineProps<{
  player: Player | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const baseStats = computed<IPlayerStats | null>(() => props.player?.baseStats ?? null)

const derived = computed<PlayerDerivedStat[]>(() => {
  if (!props.player) return []
  const p = props.player
  return [
    { key: 'hp',    label: 'Vida',     icon: '❤', value: p.maxHealth, hint: 'Salud máxima' },
    { key: 'energy',label: 'Energía',  icon: '⚡', value: p.maxEnergy, hint: 'Recurso para habilidades' },
    { key: 'atk',   label: 'Ataque',   icon: '⚔', value: p.attack(), hint: 'Daño base' },
    { key: 'def',   label: 'Defensa',  icon: '🛡', value: p.defense(), hint: 'Mitigación' },
    { key: 'spd',   label: 'Velocidad',icon: '👟', value: p.speed, hint: 'Orden de turnos' },
    { key: 'lvl',   label: 'Nivel',    icon: '✦', value: p.level, hint: 'Nivel del héroe' }
  ]
})
</script>

<template>
  <div class="player-stats-panel">
    <header class="panel-header">
      <div>
        <h3 class="panel-title">{{ player?.name || 'Héroe' }}</h3>
        <span class="panel-subtitle">Atributos del personaje</span>
      </div>
      <button class="close-btn" @click="emit('close')" aria-label="Cerrar">✕</button>
    </header>

    <section class="stats-section">
      <h4 class="section-title">Atributos base</h4>
      <ul v-if="baseStats" class="stat-grid">
        <li class="stat-row">
          <span class="stat-icon">💪</span>
          <span class="stat-label">Fuerza</span>
          <span class="stat-value">{{ baseStats.fuerza }}</span>
        </li>
        <li class="stat-row">
          <span class="stat-icon">🎯</span>
          <span class="stat-label">Destreza</span>
          <span class="stat-value">{{ baseStats.destreza }}</span>
        </li>
        <li class="stat-row">
          <span class="stat-icon">🔮</span>
          <span class="stat-label">Inteligencia</span>
          <span class="stat-value">{{ baseStats.inteligencia }}</span>
        </li>
        <li class="stat-row">
          <span class="stat-icon">📖</span>
          <span class="stat-label">Sabiduría</span>
          <span class="stat-value">{{ baseStats.sabiduria }}</span>
        </li>
        <li class="stat-row">
          <span class="stat-icon">🪨</span>
          <span class="stat-label">Constitución</span>
          <span class="stat-value">{{ baseStats.constitucion }}</span>
        </li>
        <li class="stat-row">
          <span class="stat-icon">💬</span>
          <span class="stat-label">Carisma</span>
          <span class="stat-value">{{ baseStats.carisma }}</span>
        </li>
      </ul>
    </section>

    <section class="stats-section">
      <h4 class="section-title">Estado de combate</h4>
      <ul class="stat-grid">
        <li v-for="d in derived" :key="d.key" class="stat-row derived">
          <span class="stat-icon">{{ d.icon }}</span>
          <span class="stat-label">{{ d.label }}</span>
          <span class="stat-value">{{ d.value }}</span>
        </li>
      </ul>
    </section>

    <slot name="extra" />
  </div>
</template>

<style scoped>
.player-stats-panel {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 0.75rem 0.9rem 1rem;
  background: linear-gradient(180deg, rgba(15, 22, 42, 0.96) 0%, rgba(8, 12, 26, 0.96) 100%);
  border: 1.5px solid rgba(255, 255, 255, 0.85);
  border-radius: 10px;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.6) inset,
    0 6px 24px rgba(0, 0, 0, 0.55),
    0 0 22px rgba(255, 255, 255, 0.06);
  min-width: 240px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.panel-title {
  margin: 0;
  font-family: 'Georgia', serif;
  font-size: 1.05rem;
  color: #ffe066;
  letter-spacing: 0.04em;
}

.panel-subtitle {
  font-size: 0.7rem;
  color: #888;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.close-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: #fff;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  line-height: 1;
  transition: background 0.15s;
}
.close-btn:hover { background: rgba(255, 255, 255, 0.12); }

.stats-section { display: flex; flex-direction: column; gap: 0.35rem; }

.section-title {
  margin: 0;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #b6f5b6;
}

.stat-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.stat-row {
  display: grid;
  grid-template-columns: 22px 1fr auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.4rem;
  background: rgba(255, 255, 255, 0.04);
  border-left: 2px solid rgba(255, 230, 102, 0.4);
  border-radius: 4px;
  font-size: 0.78rem;
}

.stat-row.derived { border-left-color: rgba(76, 175, 80, 0.5); }

.stat-icon { font-size: 0.95rem; text-align: center; }
.stat-label { color: #ccc; }
.stat-value {
  color: #fff;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  min-width: 32px;
  text-align: right;
}
</style>