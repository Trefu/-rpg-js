<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import chevronIcon from '@/assets/icons/arrowhead.png'

const props = defineProps<{
  messages: string[]
}>()

const emit = defineEmits<{
  (e: 'open-full'): void
}>()

const expanded = ref(false)

const recentMessages = computed(() => props.messages.slice(-2))

const hasMore = computed(() => props.messages.length > recentMessages.value.length)
const totalCount = computed(() => props.messages.length)

function toggle() {
  expanded.value = !expanded.value
}

function openFull() {
  emit('open-full')
}

const isMobile = ref(false)
function checkMobile() {
  isMobile.value = window.matchMedia('(max-width: 720px)').matches
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<template>
  <div class="combat-log-panel" :class="{ expanded }">
    <button
      class="log-toggle"
      type="button"
      @click="toggle"
      :aria-expanded="expanded"
      :title="expanded ? 'Ocultar registro' : 'Expandir registro'"
    >
      <span class="log-toggle-glyph"><img :src="chevronIcon" alt="" :class="{ collapsed: !expanded }" /></span>
      <span class="log-toggle-label">Registro</span>
      <span v-if="hasMore" class="log-toggle-badge">{{ totalCount }}</span>
    </button>

      <div v-show="expanded" class="log-body">
        <div class="log-messages">
        <p v-if="messages.length === 0" class="log-empty">Sin acciones todavía.</p>
        <div
          v-for="(message, index) in messages"
          :key="`${messages.length}-${index}`"
          class="log-message"
          :class="{ 'log-highlight': index === messages.length - 1 }"
        >
          {{ message }}
        </div>
      </div>
      <button v-if="messages.length > 6" class="log-open-full" @click="openFull" type="button">
        Ver completo ({{ messages.length }})
      </button>
    </div>

    <div v-if="!expanded" class="log-preview">
      <div
        v-for="(message, index) in recentMessages"
        :key="`prev-${messages.length}-${index}`"
        class="log-message log-preview-line"
        :class="{ 'log-highlight': index === recentMessages.length - 1 }"
      >
        {{ message }}
      </div>
      <div v-if="messages.length === 0" class="log-empty log-preview-line">Sin acciones todavía.</div>
    </div>
  </div>
</template>

<style scoped>
.combat-log-panel {
  background-color: rgba(0, 0, 0, 0.78);
  border: 1.5px solid rgba(76, 175, 80, 0.55);
  border-radius: 10px;
  color: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  max-width: 100%;
  backdrop-filter: blur(4px);
}

.log-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  background: rgba(76, 175, 80, 0.18);
  border: none;
  color: #b6f5b6;
  padding: 0.4rem 0.7rem;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  transition: background 0.15s;
}

.log-toggle:hover {
  background: rgba(76, 175, 80, 0.32);
}

.log-toggle-glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}
.log-toggle-glyph img {
  width: 14px;
  height: 14px;
  filter: brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(20deg);
}
.log-toggle-glyph img.collapsed {
  transform: rotate(180deg);
}

.log-toggle-label {
  flex: 1;
  text-align: left;
}

.log-toggle-badge {
  background: #ffe066;
  color: #1a1a2e;
  font-weight: 800;
  font-size: 0.65rem;
  padding: 0.05rem 0.4rem;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
}

.log-body {
  display: flex;
  flex-direction: column;
  max-height: 280px;
  border-top: 1px solid rgba(76, 175, 80, 0.25);
}

.log-messages {
  flex: 1;
  overflow-y: auto;
  padding: 0.35rem 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.log-messages::-webkit-scrollbar { width: 6px; }
.log-messages::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.3); }
.log-messages::-webkit-scrollbar-thumb { background: #4CAF50; border-radius: 3px; }

.log-open-full {
  align-self: center;
  margin: 0.35rem 0.5rem 0.5rem;
  background: rgba(76, 175, 80, 0.18);
  color: #b6f5b6;
  border: 1px solid rgba(76, 175, 80, 0.45);
  border-radius: 6px;
  padding: 0.25rem 0.6rem;
  font-size: 0.68rem;
  cursor: pointer;
  font-family: inherit;
}

.log-open-full:hover {
  background: rgba(76, 175, 80, 0.3);
}

.log-preview {
  padding: 0.3rem 0.6rem 0.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  max-height: 70px;
  overflow: hidden;
}

.log-message {
  color: #d8d8d8;
  font-size: 0.68rem;
  padding: 0.18rem 0.4rem;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-message.log-highlight {
  background: linear-gradient(90deg, #ffe60033 0%, #fff0 100%);
  color: #ffe066;
  font-weight: 700;
  border-left: 3px solid #ffe066;
  white-space: normal;
}

.log-preview-line {
  font-size: 0.66rem;
  padding: 0.12rem 0.35rem;
}

.log-empty {
  color: #777;
  font-style: italic;
  font-size: 0.66rem;
}

/* En mobile el panel de log queda oculto: el acceso se hace via FAB
   (CombatLogFab.vue) que abre un bottom sheet. */
@media (max-width: 720px) {
  .combat-log-panel {
    display: none !important;
  }
}

@media (min-width: 721px) {
  .combat-log-panel {
    width: clamp(260px, 32vw, 420px);
  }
}
</style>
