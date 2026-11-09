<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const emit = defineEmits<{ (e: 'done'): void }>()
const dialog = ref<HTMLElement | null>(null)
let previousFocus: HTMLElement | null = null
let timer: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  dialog.value?.focus()
  timer = setTimeout(() => emit('done'), 3500)
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  if (previousFocus?.isConnected) previousFocus.focus()
})
</script>

<template>
  <div ref="dialog" class="mountain-omen" role="dialog" aria-modal="true" aria-labelledby="mountain-omen-message" tabindex="-1" @keydown.tab.prevent>
    <div class="mountain-omen-shadow" aria-hidden="true"></div>
    <p id="mountain-omen-message" role="status">Algo acecha en la montaña.</p>
  </div>
</template>
