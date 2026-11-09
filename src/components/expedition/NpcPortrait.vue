<script setup lang="ts">
import { computed } from 'vue'
import { NPCS, type NpcId } from '@/core/npcs'
// An explicit user choice overrides the OS motion preference for this portrait only.
const props = withDefaults(defineProps<{ npcId: NpcId; animated?: boolean }>(), { animated: undefined })
const npc = computed(() => NPCS[props.npcId])
</script>

<template>
  <picture class="npc-portrait">
    <source v-if="animated === undefined" :srcset="npc.still" media="(prefers-reduced-motion: reduce)" />
    <img :src="animated === false ? npc.still : npc.animation" :alt="`${npc.name}, ${npc.title}`" decoding="async" />
  </picture>
</template>

<style scoped>
.npc-portrait { display: flex; align-items: end; justify-content: center; }
.npc-portrait img { display: block; height: 100%; max-width: 100%; width: auto; object-fit: contain; image-rendering: pixelated; filter: drop-shadow(0 12px 9px #0007); }
</style>
