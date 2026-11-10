<script setup lang="ts">
import closeIcon from '@/assets/icons/cross-mark.png'
import { computed, nextTick, ref, watch } from 'vue'
import type { CombatLogEntry } from '@/core/combat/combatLog'

const props = defineProps<{
  show: boolean
  messages: string[]
  entries?: CombatLogEntry[]
}>()
const filter = ref('all')
const filters = [{ id: 'all', label: 'Todos' }, { id: 'status', label: 'Estados' }, { id: 'damage', label: 'DoT' }]
const visibleEntries = computed(() => (props.entries ?? props.messages.map(message => ({ message, kind: 'action', turn: 0 })))
  .map((entry, index) => ({ ...entry, index }))
  .filter(entry => filter.value === 'all' || entry.kind === filter.value))
const dialog = ref<HTMLElement | null>(null)
let previousFocus: HTMLElement | null = null
watch(() => props.show, async show => {
  if (show) {
    previousFocus = document.activeElement as HTMLElement
    await nextTick()
    dialog.value?.querySelector<HTMLButtonElement>('button')?.focus()
  } else if (previousFocus?.isConnected && previousFocus !== document.body) previousFocus.focus()
  else document.querySelector<HTMLButtonElement>('.log-fab')?.focus()
})
function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
  if (event.key !== 'Tab') return
  const buttons = [...(dialog.value?.querySelectorAll<HTMLButtonElement>('button') ?? [])]
  const first = buttons[0], last = buttons[buttons.length - 1]
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
}

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <transition name="combat-log-modal">
    <div v-if="show" class="combat-log-modal-backdrop" @click.self="emit('close')">
      <div ref="dialog" class="combat-log-modal" role="dialog" aria-modal="true" aria-label="Registro de combate" @keydown="onKey">
        <header class="modal-header">
          <h3>Registro de combate</h3>
          <button class="close-btn" @click="emit('close')" aria-label="Cerrar"><img :src="closeIcon" alt="" class="close-icon" /></button>
        </header>
        <nav class="combat-log-filters" aria-label="Filtrar registro">
          <button v-for="option in filters" :key="option.id" type="button" :aria-pressed="filter === option.id" @click="filter = option.id">{{ option.label }}</button>
        </nav>
        <div class="modal-body">
          <p v-if="visibleEntries.length === 0" class="empty">Sin entradas.</p>
          <ul v-else class="log-list">
            <li
              v-for="entry in visibleEntries"
              :key="entry.index"
              class="log-line"
              :class="{ 'combat-log-turn': entry.kind === 'turn' }"
            >
              <span class="log-index">{{ entry.kind === 'turn' ? '▶' : '#' + (entry.index + 1) }}</span>
              <span class="log-text">{{ entry.message }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
@layer combat-legacy {
.combat-log-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(8, 10, 22, 0.78);
  z-index: 2500;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.combat-log-modal {
  width: min(560px, 100%);
  max-height: min(70vh, 840px);
  background: linear-gradient(180deg, #131a30 0%, #0a1024 100%);
  border: 1.5px solid rgba(255, 255, 255, 0.85);
  border-radius: 8px;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.5) inset,
    0 12px 36px rgba(0, 0, 0, 0.55),
    0 0 28px rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.25);
}

.modal-header h3 {
  margin: 0;
  font-family: 'Georgia', serif;
  font-size: 1.1rem;
  letter-spacing: 0.04em;
  color: #ffe066;
}

.close-btn {
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
.close-btn:hover { background: rgba(255, 255, 255, 0.12); }

.close-icon { width: 14px; height: 14px; display: block; margin: auto; filter: brightness(0) invert(1); }

.modal-body {
  padding: 0.75rem 1rem 1rem;
  overflow-y: auto;
  flex: 1;
}

.modal-body::-webkit-scrollbar { width: 8px; }
.modal-body::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.3); }
.modal-body::-webkit-scrollbar-thumb { background: #4CAF50; border-radius: 4px; }

.empty {
  text-align: center;
  color: #888;
  font-style: italic;
  padding: 1.5rem 0;
}

.log-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.log-line {
  display: flex;
  gap: 0.6rem;
  padding: 0.45rem 0.6rem;
  background: rgba(255, 255, 255, 0.04);
  border-left: 3px solid rgba(255, 255, 255, 0.25);
  border-radius: 4px;
  color: #eee;
  font-size: 0.85rem;
  line-height: 1.35;
}

.log-line:last-child {
  border-left-color: #ffe066;
  background: rgba(255, 230, 102, 0.08);
  color: #ffe066;
  font-weight: 600;
}

.log-index {
  color: #888;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  min-width: 32px;
  flex-shrink: 0;
}

.log-text {
  flex: 1;
  word-break: break-word;
}

.combat-log-modal-enter-active,
.combat-log-modal-leave-active {
  transition: opacity 0.2s ease;
}
.combat-log-modal-enter-active .combat-log-modal,
.combat-log-modal-leave-active .combat-log-modal {
  transition: transform 0.25s cubic-bezier(.34, 1.56, .64, 1);
}
.combat-log-modal-enter-from { opacity: 0; }
.combat-log-modal-enter-from .combat-log-modal { transform: translateY(12px) scale(0.96); }
.combat-log-modal-enter-to { opacity: 1; }
.combat-log-modal-enter-to .combat-log-modal { transform: translateY(0) scale(1); }
.combat-log-modal-leave-from { opacity: 1; }
.combat-log-modal-leave-to { opacity: 0; }
}
</style>
