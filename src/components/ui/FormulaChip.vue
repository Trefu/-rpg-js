<script setup lang="ts">
import '@/styles/hint-colors.css'
defineProps<{ formula: string }>()
</script>

<template>
  <div class="formula-chip">
    <span class="formula-chip-label">Fórmula</span>
    <span class="formula-chip-expression" v-html="formula"></span>
  </div>
</template>

<style scoped>
.formula-chip {
  display: inline-flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: .4rem;
  max-width: 100%;
  padding: .22em .6em;
  border: 1px solid rgba(130, 177, 255, .32);
  border-radius: 6px;
  background: rgba(130, 177, 255, .1);
  font-size: .8rem;
  line-height: 1.45;
}
.formula-chip-label {
  color: #b8c8e8;
  font-size: .7rem;
  letter-spacing: .06em;
  text-transform: uppercase;
  white-space: nowrap;
}
.formula-chip-expression {
  min-width: 0;
  color: #d8d8e8;
  font: .78rem/1.45 Consolas, Menlo, monospace;
  overflow-wrap: anywhere;
}
</style>
