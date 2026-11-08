<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import type { INode } from '@/core/interfaces/IExpedition'
import type { IEnemy } from '@/core/interfaces/ICharacter'
import { getCombatRewardPreview } from '@/core/expeditions/combatPreview'
import GoldAmount from '@/components/ui/GoldAmount.vue'

const props = defineProps<{ node: INode }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'confirm'): void }>()
const dialog = ref<HTMLDialogElement | null>(null)
const enemies = computed(() => (props.node.enemies ?? []) as IEnemy[])
const rewards = computed(() => getCombatRewardPreview(enemies.value))
const goldLabel = computed(() => rewards.value.minGold === rewards.value.maxGold
  ? `${rewards.value.minGold}` : `${rewards.value.minGold}–${rewards.value.maxGold}`)

onMounted(() => dialog.value?.showModal())
onBeforeUnmount(() => dialog.value?.close())
</script>

<template>
  <Teleport to="body">
    <dialog ref="dialog" class="combat-preview campaign-panel" aria-labelledby="combat-preview-title" aria-describedby="combat-preview-description" @cancel.prevent="emit('close')" @click.self="emit('close')">
      <header class="preview-heading">
        <div><span class="campaign-eyebrow">{{ node.type === 'boss' ? 'El último desafío' : 'Reconocimiento del camino' }}</span><h2 id="combat-preview-title">{{ node.type === 'boss' ? 'Combate contra el jefe' : 'Vista previa de combate' }}</h2></div>
        <button class="campaign-button preview-close" aria-label="Cerrar vista previa" @click="emit('close')">×</button>
      </header>
      <p id="combat-preview-description" class="campaign-muted">Explora las alternativas antes de avanzar. Este camino solo se elige al confirmar el combate.</p>
      <h3>Enemigos <span class="campaign-count">{{ enemies.length }}</span></h3>
      <ul class="preview-enemies">
        <li v-for="enemy in enemies" :key="enemy.id">
          <div class="enemy-portrait"><img v-if="enemy.sprite" :src="enemy.sprite" alt="" /></div>
          <div><strong>{{ enemy.name }}</strong><span>Nivel {{ enemy.level }} · {{ enemy.maxHealth }} HP</span><small v-if="enemy.intention">{{ enemy.intention }}</small></div>
        </li>
      </ul>
      <section class="preview-rewards" aria-label="Recompensas por victoria">
        <h3>Recompensas por victoria</h3>
        <div class="reward-grid">
          <div><strong class="preview-xp">{{ rewards.experience }} XP</strong><span>para cada héroe</span></div>
          <div><strong class="preview-gold"><GoldAmount :amount="goldLabel" /></strong></div>
        </div>
        <p class="campaign-note">El oro se obtiene dentro del rango indicado. Las recompensas se reciben al ganar.</p>
      </section>
      <footer class="preview-actions">
        <button class="campaign-button" autofocus @click="emit('close')">Comparar otros caminos</button>
        <button class="campaign-button primary" @click="emit('confirm')">{{ node.type === 'boss' ? 'Desafiar al jefe' : 'Entrar en combate' }}</button>
      </footer>
    </dialog>
  </Teleport>
</template>

<style scoped>
.combat-preview { width: min(540px, calc(100vw - 32px)); max-height: calc(100dvh - 40px); box-sizing: border-box; padding: 24px; overflow-y: auto; color: var(--camp-ink); background: linear-gradient(#304766, #1f334e); border: 3px solid var(--camp-border); border-radius: 4px; box-shadow: 0 20px 80px #000a; }
.combat-preview::backdrop { background: #0b1424e0; }
.preview-heading { display: flex; align-items: start; justify-content: space-between; gap: 14px; }
.preview-heading h2 { margin: 8px 0 0; color: #c2ddf5; font: 700 1.5rem Georgia, serif; }
.preview-close { padding: 4px 10px; font-size: 1.3rem; }
.combat-preview > p { font-size: .8rem; line-height: 1.6; }
.combat-preview h3 { display: flex; align-items: center; gap: 10px; font: 700 .9rem Georgia, serif; color: #c2ddf5; }
.preview-enemies { list-style: none; padding: 0; display: grid; gap: 8px; }
.preview-enemies li { display: flex; align-items: center; gap: 14px; padding: 10px; border: 1px solid var(--camp-border); background: #1c2e47; }
.enemy-portrait { width: 54px; height: 58px; display: grid; place-items: center; flex-shrink: 0; }
.enemy-portrait img { width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated; }
.preview-enemies strong, .preview-enemies span, .preview-enemies small { display: block; }
.preview-enemies strong { font-size: .9rem; color: var(--camp-ink); }
.preview-enemies span { font-size: .75rem; color: var(--camp-muted); margin-top: 5px; }
.preview-enemies small { font-size: .7rem; color: #9ec6e8; margin-top: 5px; }
.preview-rewards { margin-top: 20px; border-top: 1px solid var(--camp-border); }
.reward-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.reward-grid > div { padding: 14px; border: 1px solid var(--camp-border); background: #253b58; }
.reward-grid strong { display: flex; align-items: center; gap: 8px; font: 700 1.4rem Georgia, serif; }
.reward-grid span { display: block; margin-top: 6px; color: var(--camp-muted); font-size: .7rem; }
.preview-xp, .preview-gold { color: var(--camp-blue); }
.combat-preview button:focus-visible { outline: 2px solid #a8dfff; outline-offset: 3px; }
.preview-actions { display: flex; justify-content: space-between; gap: 12px; margin-top: 22px; }
.preview-actions button { font-size: .75rem; min-height: 44px; }
@media (max-width: 540px) { .combat-preview { padding: 18px; }.preview-heading h2 { font-size: 1.25rem; }.preview-actions { flex-direction: column-reverse; }.reward-grid > div { padding: 10px; } }
</style>
