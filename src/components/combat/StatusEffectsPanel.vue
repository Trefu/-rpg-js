<script setup lang="ts">
import { computed } from 'vue'
import type { IStatusEffect } from '@/core/interfaces/IStatusEffect'
import closeIcon from '@/assets/icons/cross-mark.png'
import sparklesIcon from '@/assets/icons/sparkles.png'

export interface StatusDetail {
  effect: IStatusEffect
}

const props = defineProps<{
  show: boolean
  effects: IStatusEffect[]
  ownerName?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const activeEffects = computed<IStatusEffect[]>(() =>
  (props.effects || []).filter(e => e && (e.turns === undefined || e.turns > 0))
)

const totalActive = computed(() => activeEffects.value.length)

function onBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close')
}

function effectAccent(effect: IStatusEffect): string {
  if (effect.isBuff) return 'buff'
  if (typeof effect.damagePerTurn === 'number' && effect.damagePerTurn > 0) return 'damage'
  if (effect.type === 'stun') return 'stun'
  return 'debuff'
}

function effectDurationLabel(effect: IStatusEffect): string {
  if (effect.turns === undefined) return ''
  return `${effect.turns} turno${effect.turns === 1 ? '' : 's'}`
}
</script>

<template>
  <transition name="status-modal">
    <div v-if="show" class="status-modal-backdrop" @click="onBackdropClick">
      <div class="status-modal" role="dialog" aria-modal="true">
        <header class="status-modal-header">
          <div>
            <h3 class="status-modal-title">Efectos de estado</h3>
            <span class="status-modal-subtitle">{{ ownerName || 'Personaje' }}</span>
          </div>
          <button class="status-close-btn" @click="emit('close')" aria-label="Cerrar"><img :src="closeIcon" alt="" class="close-icon" /></button>
        </header>

        <div class="status-modal-body">
          <div v-if="totalActive === 0" class="status-empty">
            <span class="status-empty-icon"><img :src="sparklesIcon" alt="" /></span>
            <p>Sin efectos activos.</p>
          </div>

          <ul v-else class="status-list">
            <li
              v-for="effect in activeEffects"
              :key="effect.type"
              class="status-card"
              :class="effectAccent(effect)"
            >
              <div class="status-card-icon">
                <img :src="effect.icon" :alt="effect.name" />
              </div>
              <div class="status-card-info">
                <div class="status-card-head">
                  <span class="status-card-name">{{ effect.name }}</span>
                  <span class="status-card-turns">{{ effectDurationLabel(effect) }}</span>
                </div>
                <p class="status-card-desc">{{ effect.description }}</p>
                <p v-if="typeof effect.damagePerTurn === 'number' && effect.damagePerTurn > 0" class="status-card-meta">
                  Daño por turno: <b>-{{ effect.damagePerTurn }}</b>
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.status-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(8, 10, 22, 0.78);
  z-index: 2400;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.status-modal {
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

.status-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.25);
  flex-shrink: 0;
}

.status-modal-title {
  margin: 0;
  font-family: 'Georgia', serif;
  font-size: 1.15rem;
  color: #ffe066;
  letter-spacing: 0.04em;
}

.status-modal-subtitle {
  font-size: 0.7rem;
  color: #888;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.status-close-btn {
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
.status-close-btn:hover { background: rgba(255, 255, 255, 0.12); }

.status-modal-body {
  padding: 0.85rem 1rem 1rem;
  overflow-y: auto;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.status-modal-body::-webkit-scrollbar { width: 8px; }
.status-modal-body::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.3); }
.status-modal-body::-webkit-scrollbar-thumb { background: #4CAF50; border-radius: 4px; }
.status-modal-body::-webkit-scrollbar-thumb:hover { background: #66bb6a; }

.status-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem 0;
  color: #888;
  text-align: center;
}

.status-empty-icon {
  font-size: 1.8rem;
  opacity: 0.8;
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.status-empty-icon img { width: 100%; height: 100%; object-fit: contain; }
.close-icon { width: 14px; height: 14px; display: block; margin: auto; filter: brightness(0) invert(1); }

.status-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.status-card {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 0.75rem;
  align-items: center;
  padding: 0.6rem 0.7rem;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 6px;
  border-left: 3px solid rgba(255, 255, 255, 0.25);
}

.status-card.buff    { border-left-color: #66bb6a; background: rgba(76, 175, 80, 0.1); }
.status-card.debuff  { border-left-color: #ffb74d; background: rgba(255, 138, 0, 0.08); }
.status-card.damage  { border-left-color: #b388ff; background: rgba(179, 136, 255, 0.1); }
.status-card.stun    { border-left-color: #ffd54f; background: rgba(255, 213, 79, 0.1); }

.status-card-icon img {
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.55);
  display: block;
}

.status-card-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.status-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.status-card-name {
  color: #fff;
  font-weight: 700;
  font-size: 0.95rem;
}

.status-card-turns {
  color: #ffe066;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.1rem 0.45rem;
  background: rgba(255, 230, 102, 0.12);
  border: 1px solid rgba(255, 230, 102, 0.35);
  border-radius: 999px;
  white-space: nowrap;
}

.status-card-desc {
  margin: 0;
  color: #ccc;
  font-size: 0.8rem;
  line-height: 1.3;
}

.status-card-meta {
  margin: 0;
  color: #dcc6ff;
  font-size: 0.75rem;
  font-family: 'Courier New', monospace;
}

.status-card.buff .status-card-meta { color: #b6f5b6; }

.status-modal-enter-active,
.status-modal-leave-active {
  transition: opacity 0.2s ease;
}
.status-modal-enter-active .status-modal,
.status-modal-leave-active .status-modal {
  transition: transform 0.25s cubic-bezier(.34, 1.56, .64, 1);
}
.status-modal-enter-from { opacity: 0; }
.status-modal-enter-from .status-modal { transform: translateY(12px) scale(0.96); }
.status-modal-enter-to { opacity: 1; }
.status-modal-enter-to .status-modal { transform: translateY(0) scale(1); }
.status-modal-leave-from { opacity: 1; }
.status-modal-leave-to { opacity: 0; }
</style>
