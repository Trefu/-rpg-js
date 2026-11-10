<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { Hero } from '@/core/Hero'
import HeroStatChips from '@/components/combat/HeroStatChips.vue'
import FormulaChip from '@/components/ui/FormulaChip.vue'
import DamageTypeIcon from '@/components/ui/DamageTypeIcon.vue'
import AbilityDescription from '@/components/ui/AbilityDescription.vue'
import { getAbilityIcon } from '@/core/abilities/getAbilityIcon'
import { formatPreviewRange } from '@/core/abilities/damagePipeline'
import energyIcon from '@/assets/ui/display/ability-energy.png'
import cooldownIcon from '@/assets/ui/display/ability-cooldown.png'

defineProps<{ hero: Hero; section: 'attributes' | 'abilities' }>()
const emit = defineEmits<{ (event: 'close'): void }>()
const dialog = ref<HTMLDialogElement | null>(null)
const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
onMounted(() => dialog.value?.showModal())
onBeforeUnmount(() => {
  dialog.value?.close()
  opener?.focus({ preventScroll: true })
})
</script>

<template>
  <Teleport to="body">
    <dialog ref="dialog" class="camp-hero-modal campaign-panel" aria-labelledby="camp-hero-modal-title" @cancel.prevent="emit('close')" @click.self="emit('close')">
      <header class="camp-hero-modal-heading">
        <h2 id="camp-hero-modal-title">{{ section === 'attributes' ? 'Atributos' : 'Habilidades' }} · {{ hero.name }}</h2>
        <button type="button" class="campaign-button" aria-label="Cerrar" autofocus @click="emit('close')">×</button>
      </header>
      <div class="camp-hero-modal-content">
        <div v-if="section === 'attributes'" class="camp-hero-chips">
          <HeroStatChips v-if="dialog" :hero="hero" :show-all="true" hide-attributes-header tooltip-position="below" :tooltip-target="dialog" />
        </div>
        <div v-else class="camp-hero-abilities">
          <ul><li v-for="ability in hero.abilities" :key="ability.type">
            <div><img :src="getAbilityIcon(ability.type)" alt="" /><strong>{{ ability.name }}</strong></div>
            <AbilityDescription :text="ability.description" />
            <p class="camp-ability-costs">
              <span v-if="ability.energyCost" :aria-label="`Coste: ${ability.energyCost} de energía`"><img :src="energyIcon" alt="" /> {{ ability.energyCost }}</span>
              <span v-if="ability.cooldown > 0" :aria-label="`Enfriamiento: ${ability.cooldown} turnos`"><img :src="cooldownIcon" alt="" /> {{ ability.cooldown }} turnos</span>
            </p>
            <template v-if="ability.previewEffect">
              <p class="camp-ability-preview"><DamageTypeIcon v-if="ability.previewEffect(hero).kind === 'poison'" type="poison" /> {{ ability.previewEffect(hero).label }}: {{ ability.previewEffect(hero).value }}</p>
              <FormulaChip class="camp-ability-formula" :formula="ability.previewEffect(hero).formula" />
            </template>
            <template v-else-if="ability.previewDamage">
              <p class="camp-ability-preview"><DamageTypeIcon v-if="ability.previewDamage(hero).kind !== 'heal'" :type="ability.damageType" :attack-name="ability.name" /> {{ ability.previewDamage(hero).kind === 'heal' ? 'Curación' : 'Daño' }}: {{ formatPreviewRange(ability.previewDamage(hero)) }}</p>
              <FormulaChip class="camp-ability-formula" :formula="ability.previewDamage(hero).formula" />
              <template v-if="ability.previewDamage(hero).conditional">
                <p class="camp-ability-preview"><DamageTypeIcon type="poison" /> {{ ability.previewDamage(hero).conditional!.label }}: {{ formatPreviewRange(ability.previewDamage(hero).conditional!) }}</p>
                <FormulaChip class="camp-ability-formula" :formula="ability.previewDamage(hero).conditional!.formula" />
              </template>
            </template>
          </li></ul>
        </div>
      </div>
    </dialog>
  </Teleport>
</template>
