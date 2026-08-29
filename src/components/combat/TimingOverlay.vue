<script setup lang="ts">
import { ref, watch } from 'vue'
import TimingChallenge from './TimingChallenge.vue'
import type { TimingCircleConfig, TimingResultData } from '@/types/timing'
import { BASIC_ATTACK_CONFIG } from '@/types/timing'

const props = defineProps<{
  show: boolean
  config?: TimingCircleConfig
}>()

const emit = defineEmits<{
  (e: 'result', result: TimingResultData): void
  (e: 'close'): void
}>()

const timingChallengeRef = ref<InstanceType<typeof TimingChallenge> | null>(null)

watch(() => props.show, (newShow) => {
  if (newShow) {
    setTimeout(() => {
      timingChallengeRef.value?.start()
    }, 100)
  }
})

const handleResult = (result: TimingResultData) => {
  emit('result', result)
}

const onOverlayPointerDown = () => {
  timingChallengeRef.value?.handleInput()
}
</script>

<template>
  <transition name="timing-overlay">
    <div v-if="show" class="timing-overlay" @pointerdown="onOverlayPointerDown">
      <div class="timing-overlay-content" @pointerdown.stop="onOverlayPointerDown">
        <TimingChallenge
          ref="timingChallengeRef"
          :config="config ?? BASIC_ATTACK_CONFIG"
          @result="handleResult"
        />
      </div>
    </div>
  </transition>
</template>

<style scoped>
.timing-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3500;
  pointer-events: auto;
}

.timing-overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.timing-overlay-content > * {
  pointer-events: auto;
}

.timing-overlay-enter-active,
.timing-overlay-leave-active {
  transition: opacity 0.3s ease;
}

.timing-overlay-enter-from,
.timing-overlay-leave-to {
  opacity: 0;
}
</style>