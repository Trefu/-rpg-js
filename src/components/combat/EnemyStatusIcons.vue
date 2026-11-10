<script setup lang="ts">
import type { IStatusEffect, StatusEffectSide } from '@/core/interfaces/IStatusEffect'
import StatusEffectIcons from './StatusEffectIcons.vue'
withDefaults(defineProps<{ effects: IStatusEffect[], side?: StatusEffectSide }>(), { side: 'enemy' })
</script>

<template>
  <StatusEffectIcons :effects="effects" :side="side" />
</template>
