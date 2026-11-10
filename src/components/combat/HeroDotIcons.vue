<script setup lang="ts">
import { computed } from 'vue'
import type { IStatusEffect } from '@/core/interfaces/IStatusEffect'
import { DOT_STATUS_TYPES } from '@/core/StatusEffects'
import StatusEffectIcons from './StatusEffectIcons.vue'
const props = defineProps<{ effects: IStatusEffect[] }>()
const dots = computed(() => props.effects.filter(effect => DOT_STATUS_TYPES.has(effect.type)))
</script>

<template>
  <StatusEffectIcons v-if="dots.length" class="hero-dot-icons" :effects="dots" side="player" />
</template>
