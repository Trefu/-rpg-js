<script setup lang="ts">
import { computed } from 'vue'
import { NPCS, type NpcId } from '@/core/npcs'
const props = defineProps<{ npcId: NpcId }>()
const npc = computed(() => NPCS[props.npcId])
</script>

<template>
  <picture class="npc-portrait">
    <source :srcset="npc.still" media="(prefers-reduced-motion: reduce)" />
    <img :src="npc.animation" :alt="`${npc.name}, ${npc.title}`" decoding="async" />
  </picture>
</template>

<style scoped>
.npc-portrait { display: flex; align-items: end; justify-content: center; }
.npc-portrait img { display: block; height: 100%; max-width: 100%; width: auto; object-fit: contain; image-rendering: pixelated; filter: drop-shadow(0 12px 9px #0007); }
</style>
