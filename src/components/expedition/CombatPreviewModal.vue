<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import type { INode } from '@/core/interfaces/IExpedition'
import type { IEnemy } from '@/core/interfaces/ICharacter'
import { getCombatRewardPreview } from '@/core/expeditions/combatPreview'
import GoldAmount from '@/components/ui/GoldAmount.vue'
import { ENEMY_GROUPS } from '@/core/enemies/groups'

const props = defineProps<{ node: INode }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'confirm'): void }>()
const dialog = ref<HTMLDialogElement | null>(null)
const enemies = computed(() => (props.node.enemies ?? []) as IEnemy[])
const rewards = computed(() => getCombatRewardPreview(enemies.value))
const groupLabel = computed(() => {
  const group = enemies.value[0]?.enemyGroup
  return group && enemies.value.every(enemy => enemy.enemyGroup === group) ? ENEMY_GROUPS[group].name : 'Enemigos'
})
const goldLabel = computed(() => rewards.value.minGold === rewards.value.maxGold
  ? `${rewards.value.minGold}` : `${rewards.value.minGold}–${rewards.value.maxGold}`)

onMounted(() => dialog.value?.showModal())
onBeforeUnmount(() => dialog.value?.close())
</script>

<template>
  <Teleport to="body">
    <dialog ref="dialog" class="combat-preview campaign-panel" aria-labelledby="combat-preview-title" aria-describedby="combat-preview-description" @cancel.prevent="emit('close')" @click.self="emit('close')">
      <header class="preview-heading">
        <h2 id="combat-preview-title">{{ node.type === 'boss' ? 'Combate contra el jefe' : 'Vista previa de combate' }}</h2>
        <button class="campaign-button preview-close" aria-label="Cerrar vista previa" @click="emit('close')">×</button>
      </header>
      <div class="preview-content">
      <p id="combat-preview-description" class="campaign-muted">Confirma para entrar en combate.</p>
      <h3>{{ groupLabel }} <span class="campaign-count">{{ enemies.length }}</span></h3>
      <ul class="preview-enemies">
        <li v-for="enemy in enemies" :key="enemy.id">
          <div class="enemy-portrait"><img v-if="enemy.sprite" :src="enemy.sprite" alt="" /></div>
           <div class="preview-enemy-info"><strong>{{ enemy.name }}</strong><span>Nv. {{ enemy.level }} · {{ enemy.maxHealth }} HP</span><small v-if="enemy.intention">Próximo: {{ enemy.intention }}</small></div>
        </li>
      </ul>
      <section class="preview-rewards" aria-label="Recompensas por victoria">
        <h3>Al ganar</h3>
        <dl class="reward-grid">
          <div><dt>Experiencia por héroe</dt><dd><strong class="preview-xp">{{ rewards.experience }} XP</strong></dd></div>
          <div><dt>Oro del grupo</dt><dd><strong class="preview-gold"><GoldAmount :amount="goldLabel" /></strong></dd></div>
        </dl>
      </section>
      </div>
      <footer class="preview-actions">
        <button class="campaign-button" autofocus @click="emit('close')">Comparar otros caminos</button>
        <button class="campaign-button primary" @click="emit('confirm')">{{ node.type === 'boss' ? 'Desafiar al jefe' : 'Entrar en combate' }}</button>
      </footer>
    </dialog>
  </Teleport>
</template>
