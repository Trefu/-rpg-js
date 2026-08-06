<script setup lang="ts">
defineProps<{
  show: boolean
  messages: string[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <transition name="combat-log-modal">
    <div v-if="show" class="combat-log-modal-backdrop" @click.self="emit('close')">
      <div class="combat-log-modal">
        <header class="modal-header">
          <h3>Registro de combate</h3>
          <button class="close-btn" @click="emit('close')" aria-label="Cerrar">✕</button>
        </header>
        <div class="modal-body">
          <p v-if="messages.length === 0" class="empty">Sin entradas todavía.</p>
          <ul v-else class="log-list">
            <li
              v-for="(msg, idx) in messages"
              :key="`${messages.length - idx}-${idx}`"
              class="log-line"
            >
              <span class="log-index">#{{ idx + 1 }}</span>
              <span class="log-text">{{ msg }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
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
  max-height: min(70vh, 640px);
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
</style>