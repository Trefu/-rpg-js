<script setup lang="ts">
import { computed } from 'vue'
import type { IPlayerStats } from '@/core/interfaces/ICharacter'
import type { Player } from '@/core/Player'
import heartIcon from '@/assets/icons/heart-drop.png'
import energyIcon from '@/assets/icons/bolt-drop.png'
import attackIcon from '@/assets/icons/crossed-swords.png'
import defenseIcon from '@/assets/icons/shield.png'
import speedIcon from '@/assets/icons/footprint.png'
import levelIcon from '@/assets/icons/sparkles.png'
import closeIcon from '@/assets/icons/cross-mark.png'
import fuerzaIcon from '@/assets/icons/muscle-up.png'
import destrezaIcon from '@/assets/icons/crosshair.png'
import inteligenciaIcon from '@/assets/icons/crystal-ball.png'
import sabiduriaIcon from '@/assets/icons/spell-book.png'
import constitucionIcon from '@/assets/icons/stone-crafting.png'
import carismaIcon from '@/assets/icons/chat-bubble.png'

interface PlayerDerivedStat {
  key: string
  label: string
  icon: string
  value: number
  hint?: string
}

const props = defineProps<{
  show: boolean
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
    { key: 'hp',    label: 'Vida',     icon: heartIcon, value: p.maxHealth, hint: 'Salud máxima' },
    { key: 'energy',label: 'Energía',  icon: energyIcon, value: p.maxEnergy, hint: 'Recurso para habilidades' },
    { key: 'atk',   label: 'Ataque',   icon: attackIcon, value: p.attack(), hint: 'Daño base' },
    { key: 'def',   label: 'Defensa',  icon: defenseIcon, value: p.defense(), hint: 'Mitigación' },
    { key: 'spd',   label: 'Velocidad',icon: speedIcon, value: p.speed, hint: 'Orden de turnos' },
    { key: 'lvl',   label: 'Nivel',    icon: levelIcon, value: p.level, hint: 'Nivel del héroe' }
  ]
})

function onBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close')
}
</script>

<template>
  <transition name="stats-modal">
    <div v-if="show" class="stats-modal-backdrop" @click="onBackdropClick">
      <div class="stats-modal" role="dialog" aria-modal="true">
        <header class="stats-modal-header">
          <div>
            <h3 class="stats-modal-title">{{ player?.name || 'Héroe' }}</h3>
            <span class="stats-modal-subtitle">Atributos del personaje</span>
          </div>
          <button class="stats-close-btn" @click="emit('close')" aria-label="Cerrar"><img :src="closeIcon" alt="" class="close-icon" /></button>
        </header>

        <div class="stats-modal-body">
          <section class="stats-section">
            <h4 class="section-title">Atributos base</h4>
            <ul v-if="baseStats" class="stat-grid">
              <li class="stat-row">
                <span class="stat-icon"><img :src="fuerzaIcon" alt="" /></span>
                <span class="stat-label">Fuerza</span>
                <span class="stat-value">{{ baseStats.fuerza }}</span>
              </li>
              <li class="stat-row">
                <span class="stat-icon"><img :src="destrezaIcon" alt="" /></span>
                <span class="stat-label">Destreza</span>
                <span class="stat-value">{{ baseStats.destreza }}</span>
              </li>
              <li class="stat-row">
                <span class="stat-icon"><img :src="inteligenciaIcon" alt="" /></span>
                <span class="stat-label">Inteligencia</span>
                <span class="stat-value">{{ baseStats.inteligencia }}</span>
              </li>
              <li class="stat-row">
                <span class="stat-icon"><img :src="sabiduriaIcon" alt="" /></span>
                <span class="stat-label">Sabiduría</span>
                <span class="stat-value">{{ baseStats.sabiduria }}</span>
              </li>
              <li class="stat-row">
                <span class="stat-icon"><img :src="constitucionIcon" alt="" /></span>
                <span class="stat-label">Constitución</span>
                <span class="stat-value">{{ baseStats.constitucion }}</span>
              </li>
              <li class="stat-row">
                <span class="stat-icon"><img :src="carismaIcon" alt="" /></span>
                <span class="stat-label">Carisma</span>
                <span class="stat-value">{{ baseStats.carisma }}</span>
              </li>
            </ul>
          </section>

          <section class="stats-section">
            <h4 class="section-title">Estado de combate</h4>
            <ul class="stat-grid">
              <li v-for="d in derived" :key="d.key" class="stat-row derived">
                <span class="stat-icon"><img :src="d.icon" alt="" /></span>
                <span class="stat-label">{{ d.label }}</span>
                <span class="stat-value">{{ d.value }}</span>
              </li>
            </ul>
          </section>

          <slot name="extra" />
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.stats-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(8, 10, 22, 0.78);
  z-index: 2400;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.stats-modal {
  width: min(420px, 100%);
  max-height: min(85vh, 640px);
  background: linear-gradient(180deg, #131a30 0%, #0a1024 100%);
  border: 1.5px solid rgba(255, 255, 255, 0.85);
  border-radius: 10px;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.5) inset,
    0 12px 36px rgba(0, 0, 0, 0.55),
    0 0 28px rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.stats-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.25);
  flex-shrink: 0;
}

.stats-modal-title {
  margin: 0;
  font-family: 'Georgia', serif;
  font-size: 1.15rem;
  color: #ffe066;
  letter-spacing: 0.04em;
}

.stats-modal-subtitle {
  font-size: 0.7rem;
  color: #888;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.stats-close-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: #fff;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  line-height: 1;
  transition: background 0.15s;
}
.stats-close-btn:hover { background: rgba(255, 255, 255, 0.12); }

.stats-modal-body {
  padding: 0.85rem 1rem 1rem;
  overflow-y: auto;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.stats-modal-body::-webkit-scrollbar { width: 8px; }
.stats-modal-body::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.3); }
.stats-modal-body::-webkit-scrollbar-thumb { background: #4CAF50; border-radius: 4px; }
.stats-modal-body::-webkit-scrollbar-thumb:hover { background: #66bb6a; }

.stats-section { display: flex; flex-direction: column; gap: 0.4rem; }

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
  gap: 0.25rem;
}

.stat-row {
  display: grid;
  grid-template-columns: 24px 1fr auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.5rem;
  background: rgba(255, 255, 255, 0.04);
  border-left: 2px solid rgba(255, 230, 102, 0.4);
  border-radius: 4px;
  font-size: 0.85rem;
}

.stat-row.derived { border-left-color: rgba(76, 175, 80, 0.5); }

.stat-icon { font-size: 0.95rem; text-align: center; display: inline-flex; align-items: center; justify-content: center; }
.stat-icon img { width: 18px; height: 18px; object-fit: contain; }
.close-icon { width: 14px; height: 14px; display: block; margin: auto; filter: brightness(0) invert(1); }
.stat-label { color: #ccc; }
.stat-value {
  color: #fff;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  min-width: 36px;
  text-align: right;
}

.stats-modal-enter-active,
.stats-modal-leave-active {
  transition: opacity 0.2s ease;
}
.stats-modal-enter-active .stats-modal,
.stats-modal-leave-active .stats-modal {
  transition: transform 0.25s cubic-bezier(.34, 1.56, .64, 1);
}
.stats-modal-enter-from { opacity: 0; }
.stats-modal-enter-from .stats-modal { transform: translateY(12px) scale(0.96); }
.stats-modal-enter-to { opacity: 1; }
.stats-modal-enter-to .stats-modal { transform: translateY(0) scale(1); }
.stats-modal-leave-from { opacity: 1; }
.stats-modal-leave-to { opacity: 0; }
</style>