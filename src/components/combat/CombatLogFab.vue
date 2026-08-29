<script setup lang="ts">
import { ref, computed } from 'vue'
import scrollIcon from '@/assets/icons/arrowhead.png'
import closeIcon from '@/assets/icons/cross-mark.png'

const props = defineProps<{
  messages: string[]
}>()

const emit = defineEmits<{
  (e: 'open-full'): void
}>()

const open = ref(false)

const lastMessage = computed(() =>
  props.messages.length > 0 ? props.messages[props.messages.length - 1] : 'Sin acciones todavía.'
)

const totalCount = computed(() => props.messages.length)

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}
</script>

<template>
  <div class="log-fab-wrap">
    <button
      type="button"
      class="log-fab"
      :aria-expanded="open"
      :title="open ? 'Cerrar registro' : `Registro (${totalCount})`"
      @click="toggle"
    >
      <img v-if="!open" :src="scrollIcon" alt="" class="log-fab-icon" />
      <img v-else :src="closeIcon" alt="" class="log-fab-icon" />
      <span v-if="!open && totalCount > 0" class="log-fab-badge">{{ totalCount }}</span>
    </button>

    <transition name="log-sheet">
      <div v-if="open" class="log-sheet-backdrop" @click.self="close">
        <div class="log-sheet" role="dialog" aria-label="Registro de combate">
          <div class="log-sheet-header">
            <span class="log-sheet-title">Registro</span>
            <span class="log-sheet-count">{{ totalCount }}</span>
            <button v-if="totalCount > 6" type="button" class="log-sheet-full" @click="emit('open-full')">
              Ver completo
            </button>
          </div>
          <div class="log-sheet-body">
            <p v-if="totalCount === 0" class="log-sheet-empty">Sin acciones todavía.</p>
            <div
              v-for="(message, index) in messages"
              :key="`${totalCount}-${index}`"
              class="log-sheet-message"
              :class="{ 'log-sheet-highlight': index === messages.length - 1 }"
            >
              {{ message }}
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.log-fab-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  pointer-events: none;
}

.log-fab-wrap > * {
  pointer-events: auto;
}

.log-fab-preview {
  background: rgba(0, 0, 0, 0.85);
  border: 1px solid rgba(76, 175, 80, 0.5);
  color: #b6f5b6;
  font-size: 0.7rem;
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
  max-width: 200px;
  text-align: right;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  line-height: 1.25;
}

.log-fab {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(145deg, #2e7d32 0%, #1b5e20 100%);
  border: 2px solid rgba(180, 230, 180, 0.5);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  -webkit-tap-highlight-color: transparent;
}

.log-fab:active {
  transform: scale(0.94);
}

.log-fab-icon {
  width: 22px;
  height: 22px;
  filter: brightness(0) invert(1);
}

.log-fab-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background: #ffe066;
  color: #1a1a2e;
  font-family: 'Courier New', monospace;
  font-size: 0.65rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #1a1a2e;
  line-height: 1;
}

.log-sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 60;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.log-sheet {
  width: 100%;
  max-height: 70vh;
  background: linear-gradient(180deg, #1e2035 0%, #131425 100%);
  border-top: 2px solid rgba(255, 230, 102, 0.45);
  border-radius: 16px 16px 0 0;
  padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom)) 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.6);
}

.log-sheet-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 230, 102, 0.25);
}

.log-sheet-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #ffe066;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.log-sheet-count {
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  color: #b6f5b6;
  background: rgba(76, 175, 80, 0.18);
  border: 1px solid rgba(76, 175, 80, 0.4);
  padding: 0.1rem 0.45rem;
  border-radius: 8px;
}

.log-sheet-full {
  margin-left: auto;
  background: rgba(76, 175, 80, 0.2);
  color: #b6f5b6;
  border: 1px solid rgba(76, 175, 80, 0.5);
  border-radius: 6px;
  padding: 0.3rem 0.6rem;
  font-size: 0.7rem;
  font-family: inherit;
  cursor: pointer;
}

.log-sheet-body {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding-right: 4px;
}

.log-sheet-body::-webkit-scrollbar { width: 6px; }
.log-sheet-body::-webkit-scrollbar-thumb { background: #4CAF50; border-radius: 3px; }

.log-sheet-empty {
  color: #777;
  font-style: italic;
  font-size: 0.75rem;
  text-align: center;
  padding: 1.5rem 0;
}

.log-sheet-message {
  font-size: 0.75rem;
  color: #d8d8d8;
  padding: 0.4rem 0.55rem;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 6px;
  line-height: 1.3;
}

.log-sheet-highlight {
  background: linear-gradient(90deg, #ffe60033 0%, rgba(255, 230, 0, 0) 100%);
  color: #ffe066;
  font-weight: 700;
  border-left: 3px solid #ffe066;
}

.log-last-enter-active,
.log-last-leave-active {
  transition: opacity 0.2s ease;
}
.log-last-enter-from,
.log-last-leave-to {
  opacity: 0;
}

.log-sheet-enter-active,
.log-sheet-leave-active {
  transition: opacity 0.2s ease;
}
.log-sheet-enter-active .log-sheet,
.log-sheet-leave-active .log-sheet {
  transition: transform 0.22s ease;
}
.log-sheet-enter-from,
.log-sheet-leave-to {
  opacity: 0;
}
.log-sheet-enter-from .log-sheet,
.log-sheet-leave-to .log-sheet {
  transform: translateY(100%);
}
</style>
