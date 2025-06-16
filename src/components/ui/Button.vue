<script setup lang="ts">
defineProps<{
  text: string
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}>()

defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <button
    class="game-button"
    :class="[
      `game-button--${variant || 'primary'}`,
      { 'game-button--disabled': disabled }
    ]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    {{ text }}
  </button>
</template>

<style scoped>
.game-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.game-button--primary {
  background-color: #4CAF50;
  color: white;
}

.game-button--secondary {
  background-color: #2196F3;
  color: white;
}

.game-button--danger {
  background-color: #f44336;
  color: white;
}

.game-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.game-button:hover:not(.game-button--disabled) {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style> 