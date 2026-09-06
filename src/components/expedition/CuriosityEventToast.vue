<script setup lang="ts">
import { computed } from 'vue'
import closeIcon from '@/assets/icons/cross-mark.png'
import rewardIcon from '@/assets/icons/coins-pile.png'
import punishmentIcon from '@/assets/icons/bloody-sword.png'
import noopIcon from '@/assets/icons/help.png'
import ambushIcon from '@/assets/icons/crossed-swords.png'
import type { CuriosityResultSummary } from '@/core/events/curiosityResultSummary'

const props = defineProps<{
  summary: CuriosityResultSummary | null
}>()

const emit = defineEmits<{
  (e: 'dismiss'): void
}>()

const kindClass = computed(() => props.summary?.kind ?? 'noop')
const headerIcon = computed(() => {
  switch (props.summary?.kind) {
    case 'reward': return rewardIcon
    case 'punishment': return punishmentIcon
    case 'ambush': return ambushIcon
    default: return noopIcon
  }
})
const kindLabel = computed(() => {
  switch (props.summary?.kind) {
    case 'reward': return 'Recompensa'
    case 'punishment': return 'Consecuencia'
    case 'ambush': return 'Emboscada'
    default: return 'Sin cambios'
  }
})

function dismiss() {
  emit('dismiss')
}
</script>

<template>
  <transition name="toast-slide">
    <div v-if="summary" class="curiosity-toast" :class="kindClass" role="status">
      <div class="curiosity-toast-icon">
        <img :src="headerIcon" alt="" />
      </div>
      <div class="curiosity-toast-body">
        <div class="curiosity-toast-head">
          <span class="curiosity-toast-kind">{{ kindLabel }}</span>
          <span class="curiosity-toast-title">{{ summary.title }}</span>
        </div>
        <p class="curiosity-toast-flavor">{{ summary.flavor }}</p>
        <ul v-if="summary.lines.length > 0" class="curiosity-toast-lines">
          <li v-for="(line, i) in summary.lines" :key="i">{{ line }}</li>
        </ul>
      </div>
      <button
        class="curiosity-toast-close"
        type="button"
        @click="dismiss"
        title="Cerrar"
      >
        <img :src="closeIcon" alt="" />
      </button>
    </div>
  </transition>
</template>

<style scoped>
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: transform 0.35s ease, opacity 0.35s ease;
}
.toast-slide-enter-from {
  transform: translateY(-120%);
  opacity: 0;
}
.toast-slide-leave-to {
  transform: translateY(-120%);
  opacity: 0;
}

.curiosity-toast {
  position: fixed;
  top: 0.75rem;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 1.5rem);
  max-width: 480px;
  background: linear-gradient(180deg, #1f2230 0%, #15171f 100%);
  color: #e8e8ea;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: stretch;
  gap: 0.6rem;
  padding: 0.65rem 0.75rem;
  z-index: 1200;
}

.curiosity-toast.reward {
  border-color: rgba(76, 175, 80, 0.6);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(76, 175, 80, 0.35);
}
.curiosity-toast.punishment {
  border-color: rgba(244, 67, 54, 0.6);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(244, 67, 54, 0.35);
}
.curiosity-toast.ambush {
  border-color: rgba(255, 152, 0, 0.65);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 152, 0, 0.35);
}
.curiosity-toast.noop {
  border-color: rgba(255, 255, 255, 0.18);
}

.curiosity-toast-icon {
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}
.curiosity-toast-icon img {
  width: 22px;
  height: 22px;
  filter: brightness(0) invert(1);
}
.curiosity-toast.reward .curiosity-toast-icon img {
  filter: none;
}
.curiosity-toast.punishment .curiosity-toast-icon img {
  filter: none;
}
.curiosity-toast.ambush .curiosity-toast-icon img {
  filter: none;
}

.curiosity-toast-body {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.curiosity-toast-head {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.curiosity-toast-kind {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(232, 232, 234, 0.7);
}
.curiosity-toast.reward .curiosity-toast-kind {
  background: rgba(76, 175, 80, 0.22);
  color: #c8e6c9;
}
.curiosity-toast.punishment .curiosity-toast-kind {
  background: rgba(244, 67, 54, 0.22);
  color: #ffcdd2;
}
.curiosity-toast.ambush .curiosity-toast-kind {
  background: rgba(255, 152, 0, 0.22);
  color: #ffe0b2;
}
.curiosity-toast-title {
  font-size: 0.95rem;
  font-weight: 600;
}

.curiosity-toast-flavor {
  margin: 0;
  font-size: 0.82rem;
  font-style: italic;
  color: rgba(232, 232, 234, 0.78);
  line-height: 1.35;
}

.curiosity-toast-lines {
  margin: 0.1rem 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.curiosity-toast-lines li {
  font-size: 0.85rem;
  color: #e8e8ea;
  padding-left: 0.85rem;
  position: relative;
}
.curiosity-toast-lines li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: rgba(232, 232, 234, 0.55);
}

.curiosity-toast-close {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 6px;
  width: 28px;
  height: 28px;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  align-self: flex-start;
}
.curiosity-toast-close img {
  width: 14px;
  height: 14px;
  filter: brightness(0) invert(1);
}
</style>
