<script setup lang="ts">
import { computed } from 'vue'
import '@/styles/hint-colors.css'

const props = defineProps<{ text: string }>()
const parts = computed(() => props.text.split(/(\bAGILIDAD\b)/))
</script>

<template>
  <p><template v-for="(part, index) in parts" :key="index"><span v-if="part === 'AGILIDAD'" class="hint-agi">{{ part }}</span><template v-else>{{ part }}</template></template></p>
</template>
