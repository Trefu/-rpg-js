<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useGameStore } from '@/stores/game'
import { useExpeditionStore } from '@/stores/expedition'
import { resolveAmbushEnemies } from '@/core/expeditions/ambushes'
import { AudioManager } from '@/core/AudioManager'
import { resolveCuriosityChoice, type CuriosityChoice, type Effect, type ResolveResult } from '@/core/events/curiosityEvents'
import { summarizeCuriosityResult } from '@/core/events/curiosityResultSummary'
import { pickRandomFromList } from '@/core/expeditions/pickRandom'
import { getItem } from '@/core/items/items'
import curiosityIcon from '@/assets/icons/magic-portal.png'
import cacheIcon from '@/assets/icons/chest.png'
import springIcon from '@/assets/icons/heart-drop.png'
import combatIcon from '@/assets/icons/crossed-swords.png'
import closeIcon from '@/assets/icons/cross-mark.png'
import GoldAmount from '@/components/ui/GoldAmount.vue'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'ambush', payload: { nodeId: string, enemies: any[] }): void
  (e: 'resolved', payload: { eventId: string, title: string, result: ResolveResult }): void
}>()
const gameStore = useGameStore()
const expeditionStore = useExpeditionStore()
const audioManager = AudioManager.getInstance()
// Pick once per visit; changes to the party or wallet must not reroll the event.
const fixedEventId = expeditionStore.selectedNode?.curiosityEventId
const event = fixedEventId
  ? expeditionStore.currentConfig?.curiosityEvents?.find(event => event.id === fixedEventId)
  : pickRandomFromList(expeditionStore.activeCuriosityEvents)
if (!event) throw new Error(`Unknown fixed curiosity event: ${fixedEventId}`)
const inescapable = event.inescapable === true
const result = ref<ResolveResult | null>(null)
const chosenChoice = ref<CuriosityChoice | null>(null)
const departed = ref(false)
const dialog = ref<HTMLElement | null>(null)
let previousFocus: HTMLElement | null = null
const isAmbush = computed(() => result.value?.kind === 'ambush')
const summary = computed(() => result.value ? summarizeCuriosityResult(event.title, result.value) : null)
const illustration = computed(() => event.id.includes('spring') ? springIcon
  : event.id.includes('cache') ? cacheIcon : event.choices.some(c => c.outcome.kind === 'ambush') ? combatIcon : curiosityIcon)
const chapter = computed(() => event.id.includes('spring') ? 'Un lugar para respirar'
  : event.id.includes('cache') ? 'Algo olvidado en el camino' : 'El camino tiene sus propias historias')

onMounted(() => {
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  dialog.value?.focus()
  audioManager.playCuriosityOpenSound()
})
onBeforeUnmount(() => { if (previousFocus && document.contains(previousFocus)) previousFocus.focus() })

function choiceTone(choice: CuriosityChoice): 'risk' | 'reward' | 'neutral' {
  if (choice.outcome.kind === 'ambush') return 'risk'
  if (choice.outcome.kind === 'noop') return 'neutral'
  return choice.outcome.effects.some(e => ['damage', 'energyLoss', 'loseItem', 'loseRandomItem'].includes(e.kind) || (e.kind === 'gold' && e.amount < 0)) ? 'risk' : 'reward'
}

function effectLabel(effect: Effect): string {
  switch (effect.kind) {
    case 'gold': return `${effect.amount > 0 ? '+' : ''}${effect.amount} compartido`
    case 'xp': return `+${effect.amount} XP por héroe`
    case 'xpPercent': return `+${effect.percent}% XP por héroe`
    case 'heal': return `+${effect.amount} HP por héroe`
    case 'fullHeal': return 'Curación completa'
    case 'restoreEnergy': return `+${effect.amount} energía por héroe`
    case 'energyLoss': return `−${effect.amount} energía por héroe`
    case 'damage': return `−${effect.amount} HP por héroe`
    case 'grantItem': return `+1 ${getItem(effect.itemId)?.name ?? effect.itemId}`
    case 'loseItem': return `−1 ${getItem(effect.itemId)?.name ?? effect.itemId}`
    case 'loseRandomItem': return 'Pierdes un consumible'
  }
}

function previews(choice: CuriosityChoice): string[] {
  const outcome = choice.outcome
  if (outcome.kind === 'ambush') return ['Combate adicional', 'Botín por victoria']
  if (outcome.kind === 'noop') return ['Sin coste', 'Sin recompensa']
  return outcome.effects.map(effectLabel)
}

function choose(choice: CuriosityChoice) {
  if (result.value || departed.value) return
  chosenChoice.value = choice
  if (!expeditionStore.resolvedEventIds.includes(event.id)) expeditionStore.resolvedEventIds.push(event.id)
  audioManager.playCuriosityConfirmSound()
  const resolved = resolveCuriosityChoice(choice, { heroes: gameStore.activeHeroes, teamItems: gameStore.teamItems, wallet: gameStore })
  result.value = resolved
  if (resolved.kind === 'ambush') audioManager.playCuriosityAmbushSound()
  else if (resolved.kind === 'noop') audioManager.playCuriosityNoopSound()
  else {
    const hasDamage = resolved.effects.some(e => e.kind === 'damage' || e.kind === 'energyLoss' || e.kind === 'loseItem')
    const hasReward = resolved.effects.some(e => ['heal', 'fullHeal', 'restoreEnergy', 'grantItem', 'gold', 'xp'].includes(e.kind))
    if (hasDamage) audioManager.playCuriosityPunishmentSound()
    else if (hasReward) audioManager.playCuriosityRewardSound()
    else audioManager.playCuriosityNoopSound()
  }
  dialog.value?.focus()
  if (inescapable && resolved.kind === 'ambush') continueAfterResolution()
}

function floorForSelectedNode(): number {
  const node = expeditionStore.selectedNode
  const config = expeditionStore.currentConfig
  if (!node || !config || node.id === 'start') return 1
  if (node.curiosityEventId) return node.depth ?? 1
  if (node.id === 'boss') return config.totalFloors
  const row = Number(node.id.replace(/^branch-/, '').replace(/^extra-/, '').split('-')[1])
  return Math.max(2, Math.min(config.totalFloors - 1, (Number.isFinite(row) ? row : 1) + 1))
}

function continueAfterResolution() {
  if (departed.value) return
  departed.value = true
  const resolved = result.value
  if (resolved?.kind === 'ambush') {
    const nodeId = expeditionStore.selectedNode?.id
    const config = expeditionStore.currentConfig
    if (nodeId && config) {
      const outcome = chosenChoice.value?.outcome
      if (outcome?.kind !== 'ambush') throw new Error('Missing contextual ambush group')
      const enemies = resolveAmbushEnemies(config, outcome, floorForSelectedNode())
      emit('ambush', { nodeId, enemies })
      return
    }
  } else if (resolved) emit('resolved', { eventId: event.id, title: event.title, result: resolved })
  emit('close')
}

function close() {
  if (inescapable) return
  if (isAmbush.value) return
  if (result.value) continueAfterResolution()
  else emit('close')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close() }
  if (e.key !== 'Tab') return
  const buttons = Array.from(dialog.value?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])
  const first = buttons[0]
  const last = buttons[buttons.length - 1]
  if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog.value)) { e.preventDefault(); last?.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
}
</script>

<template>
  <transition name="curiosity-fade">
    <div class="curiosity-overlay" @mousedown.self="close">
      <div ref="dialog" class="curiosity-modal" :class="{ 'is-ambush': isAmbush, 'is-inescapable': inescapable }" role="dialog" aria-modal="true" aria-labelledby="curiosity-title" aria-describedby="curiosity-description" tabindex="-1" @keydown="onKeydown">
        <header class="curiosity-header"><span class="event-location"><span class="event-location-dot"></span>MONTAÑAS ROCOSAS · PISO {{ floorForSelectedNode() }}</span><button v-if="!inescapable" class="curiosity-close" type="button" @click="close" :disabled="isAmbush" :title="isAmbush ? 'Resuelve el combate para continuar' : 'Cerrar'" aria-label="Cerrar evento"><img :src="closeIcon" alt="" /></button></header>
        <div class="event-layout">
          <aside class="event-illustration" aria-hidden="true"><div class="event-rune rune-outer"></div><div class="event-rune rune-inner"></div><span class="event-star">✦</span><img :src="illustration" alt="" /><span class="event-illustration-label">{{ result ? 'EL CAMINO RECUERDA' : 'UN ALTO EN EL CAMINO' }}</span></aside>
          <div class="event-story">
            <span class="event-chapter">{{ chapter }}</span><h2 id="curiosity-title">{{ event.title }}</h2>
            <template v-if="!result">
              <p id="curiosity-description" class="curiosity-flavor">{{ event.flavor }}</p>
              <div class="event-choice-heading"><span>Elige una opción</span></div>
               <ul v-if="inescapable" class="curiosity-choices spectral-choices"><li v-for="choice in event.choices" :key="choice.id"><button class="curiosity-choice-btn" type="button" @click="choose(choice)"><strong>{{ choice.label }}</strong></button></li></ul>
               <ul v-else class="curiosity-choices"><li v-for="(choice, index) in event.choices" :key="choice.id"><button class="curiosity-choice-btn" :class="choiceTone(choice)" type="button" @click="choose(choice)"><span class="choice-number">{{ String(index + 1).padStart(2, '0') }}</span><span class="choice-body"><span class="choice-tone">{{ choice.outcome.kind === 'ambush' ? 'ACEPTAR EL RIESGO' : choiceTone(choice) === 'risk' ? 'COSTE Y RECOMPENSA' : choiceTone(choice) === 'neutral' ? 'CONTINUAR EL CAMINO' : 'APROVECHAR LA OCASIÓN' }}</span><strong>{{ choice.label }}</strong><span class="choice-effects"><span v-for="(preview, i) in previews(choice)" :key="i">{{ preview }}</span></span></span><span class="choice-arrow" aria-hidden="true">↗</span></button></li></ul>
               <p v-if="!inescapable" class="event-skip-note">Pulsa fuera para ignorar.</p>
            </template>
            <template v-else>
              <span class="event-result-tag" :class="summary?.kind">{{ isAmbush ? 'COMBATE INMINENTE' : summary?.kind === 'reward' ? 'LA COMPAÑÍA PROGRESA' : summary?.kind === 'punishment' ? 'EL PRECIO DEL CAMINO' : 'LA HISTORIA CONTINÚA' }}</span>
              <p id="curiosity-description" class="curiosity-resolution">{{ summary?.flavor }}</p>
              <div v-if="summary?.lines.length" class="event-result-lines"><p v-for="line in summary.lines" :key="line"><span aria-hidden="true">{{ isAmbush ? '⚔' : '◇' }}</span>{{ line }}</p></div>
              <p v-if="chosenChoice" class="event-chosen">Vuestra decisión <strong>{{ chosenChoice.label }}</strong></p>
              <button class="curiosity-continue campaign-button" :class="isAmbush ? 'danger' : 'primary'" type="button" @click="continueAfterResolution">{{ isAmbush ? 'Enfrentar el combate' : 'Seguir el camino' }}<span aria-hidden="true">→</span></button>
            </template>
          </div>
        </div>
        <footer class="event-footer"><GoldAmount :amount="gameStore.gold" /></footer>
      </div>
    </div>
  </transition>
</template>

<style scoped>
@layer menu-legacy {
.curiosity-fade-enter-active, .curiosity-fade-leave-active { transition: opacity .2s ease; }.curiosity-fade-enter-from, .curiosity-fade-leave-to { opacity: 0; }
.curiosity-overlay { position: fixed; inset: 0; z-index: 1100; background: #080d09d9; display: flex; align-items: center; justify-content: center; padding: 18px; }
.curiosity-modal { width: 100%; max-width: 890px; max-height: calc(100dvh - 36px); overflow-y: auto; color: #e8e1c8; background: #26382c; border: 3px solid #a29453; border-radius: 3px; box-shadow: inset 2px 2px #c5c08b55, inset -3px -3px #132117, 0 12px 0 #0b120d, 0 22px 50px #000b; outline: none; font-family: 'Courier New', monospace; }
.curiosity-header { display: flex; justify-content: space-between; align-items: center; padding: 11px 15px; border-bottom: 2px solid #8e814d; background: linear-gradient(#45583c, #344432); box-shadow: inset 0 2px #a9b17733; }
.event-location { display: flex; align-items: center; gap: 8px; font: 700 .58rem 'Courier New',monospace; letter-spacing: .05em; color: #e4d98c; }.event-location-dot { width: 7px; height: 7px; background: #c7d16d; border: 1px solid #eef39b; box-shadow: 0 0 4px #cadb75; }
.curiosity-close { width: 30px; height: 29px; background: #323b2c; border: 2px solid #a3975d; border-radius: 2px; cursor: pointer; display: grid; place-items: center; box-shadow: inset 1px 1px #ffffff30, 2px 2px #172018; }.curiosity-close img { width: 12px; height: 12px; opacity: .85; }.curiosity-close:hover { background: #586345; }.curiosity-close:disabled { opacity: .25; cursor: default; }
.event-layout { display: grid; grid-template-columns: 195px minmax(0, 1fr); }
.event-illustration { position: relative; overflow: hidden; min-height: 390px; display: flex; align-items: center; justify-content: center; background: repeating-linear-gradient(0deg,#283d2d 0 8px,#2c4232 8px 16px); border-right: 2px solid #92834d; }
.event-illustration::after { content:'';position:absolute;inset:auto 0 0;height:130px;background:#40573b;clip-path:polygon(0 76%,13% 48%,25% 68%,42% 5%,59% 61%,72% 31%,100% 72%,100% 100%,0 100%);box-shadow:inset 0 3px #9eaa77; }
.event-illustration > img { width: 59px; height: 59px; object-fit: contain; filter: drop-shadow(2px 3px #101a11); z-index: 1; margin-top: -54px; image-rendering: pixelated; }
.event-rune { position: absolute; border: 2px solid #c7b95e55; border-radius: 2px; top: calc(50% - 106px); left: calc(50% - 77px); width: 154px; height: 154px; transform: rotate(45deg); box-shadow: 3px 3px #1a271a; }
.rune-inner { width: 111px; height: 111px; top: calc(50% - 84px); left: calc(50% - 55px); border-style: dashed; opacity: .7; }
.event-star { position: absolute; top: calc(50% - 128px); color: #f0d663; background: #344432; padding: 0 5px; z-index: 1; font-size: .8rem; }
.event-illustration-label { position: absolute; bottom: 24px; font-size: .47rem; color: #e5d88b; letter-spacing: .08em; z-index: 1; text-shadow: 1px 1px #162318; }
.event-story { padding: 20px 23px; min-width: 0; }
.event-steps { display: flex; align-items: center; gap: 9px; margin-bottom: 18px; font: 700 .56rem 'Courier New',monospace; color: #87977b; }.event-steps > i { height: 2px; width: 25px; background: #918650; }.event-steps .active { color: #f0dc7a; }
.event-story .campaign-eyebrow { font-size: .57rem; }.event-story h2 { font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 700; line-height: 1.1; margin: 7px 0 12px; color: #f0dfa0; text-shadow: 2px 2px #4a321e; }
.curiosity-flavor { font: italic .9rem/1.65 Georgia, serif; color: #c6c9a7; margin: 0 0 18px; }
.event-choice-heading { display: flex; justify-content: space-between; gap: 10px; align-items: center; margin-bottom: 9px; }.event-choice-heading > span { font-size: .7rem; color: #e4daa8; }.event-choice-heading small { color: #aab18d; font: .5rem 'Courier New',monospace; }
.curiosity-choices { padding: 0; margin: 0; list-style: none; display: grid; gap: 8px; }
.curiosity-choice-btn { width: 100%; border: 2px solid #92905c; background: linear-gradient(#3b4d37, #2d402f); border-radius: 2px; color: #f0e8c9; padding: 10px; display: flex; gap: 10px; align-items: start; text-align: left; cursor: pointer; min-height: 68px; box-shadow: inset 1px 1px #d2d19838, inset -2px -2px #1e2d21, 2px 3px #111b14; }
.curiosity-choice-btn:hover { background: linear-gradient(#536743,#354b32); border-color: #d0bd6d; }.curiosity-choice-btn.risk { border-color: #a67c4d; background: linear-gradient(#4a4030,#39362a); }.curiosity-choice-btn.risk:hover { background: #564731; border-color: #d5a46f; }
.choice-number { font: 700 .76rem 'Courier New',monospace; color: #f1d46a; margin-top: 15px; padding-right: 9px; border-right: 1px solid #bcb56b; }
.choice-body { flex: 1; min-width: 0; }.choice-tone { display: block; font: 700 .47rem 'Courier New',monospace; color: #c3d283; margin-bottom: 5px; }.risk .choice-tone { color: #e6ae73; }.neutral .choice-tone { color: #b1bc9f; }
.choice-body > strong { display: block; font: 700 .74rem/1.45 'Courier New',monospace; }
.choice-effects { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 7px; }.choice-effects > span { border-radius: 2px; padding: 4px 5px; background: #1c2b20; border: 1px solid #828850; font: .5rem 'Courier New',monospace; color: #d1d3a2; }.risk .choice-effects > span { color: #e4bf8e; border-color: #a38457; }
.choice-arrow { color: #e4d16d; font-size: .85rem; margin-top: 13px; }
.event-skip-note { font: .55rem/1.5 'Courier New',monospace; color: #adb493; margin: 12px 0 0; }
.event-result-tag { display: inline-flex; font:700 .53rem 'Courier New',monospace; color: #e2e994; border: 2px solid #879354; background:#34422c; padding: 6px 8px; border-radius: 2px; margin: 3px 0 12px; box-shadow:2px 2px #151e16; }.event-result-tag.ambush, .event-result-tag.punishment { color: #f0bd78; border-color: #a77748; background:#493926; }
.curiosity-resolution { font: italic 1rem/1.65 Georgia, serif; color: #dedbb4; margin: 0 0 17px; }
.event-result-lines { padding: 9px 12px; background: #1c2b20; border: 2px solid #89844f; box-shadow:inset 1px 1px #c7c48a22; }.event-result-lines > p { display: flex; align-items: center; gap: 9px; color: #e0dda9; font: .7rem/1.5 'Courier New',monospace; margin: 7px 0; }.event-result-lines > p > span { color: #e3cd68; }
.event-chosen { color: #aeb491; font: .55rem 'Courier New',monospace; margin: 15px 0; }.event-chosen strong { display: block; color: #d0cfaa; font-weight: 400; line-height: 1.5; margin-top: 4px; }
.curiosity-continue { width: 100%; justify-content: space-between; }.curiosity-continue.danger { background: linear-gradient(#aa6837,#794523); border-color: #e1ab62; color: #fff0c5; }
.event-footer { border-top: 2px solid #897d49; padding: 11px 16px; display: flex; align-items: center; justify-content: space-between; gap: 10px; font: italic .62rem Georgia, serif; color: #bfc099; background:#30402f; }
.event-wallet { display: flex; align-items: center; gap: 6px; color: #f0d779; font:700 .6rem 'Courier New',monospace; white-space: nowrap; }.event-wallet img { width: 14px; height: 14px; image-rendering:pixelated; }
.is-ambush .event-illustration { background: repeating-linear-gradient(0deg,#382f25 0 8px,#403329 8px 16px); }
@media (max-width: 720px) {
  .curiosity-overlay { align-items: flex-end; padding: 12px 0 0; }.curiosity-modal { max-height: calc(100dvh - 12px); border-radius: 18px 18px 0 0; border-bottom: 0; }.curiosity-header { padding: 13px 18px; }.event-location { font-size: .48rem; }
  .event-layout { grid-template-columns: 1fr; }.event-illustration { min-height: 90px; height: 90px; border-right: 0; border-bottom: 2px solid #92834d; }.event-illustration > img { width: 42px; height: 42px; margin: 0; }.event-rune { width: 70px; height: 70px; top: 10px; left: calc(50% - 35px); }.rune-inner { width: 50px; height: 50px; top: 20px; left: calc(50% - 25px); }.event-star { top: 0; font-size: .6rem; }.event-illustration-label { display: none; }.event-illustration::after { height: 100%; }
  .event-story { padding: 15px 15px 18px; }.event-steps { margin-bottom: 14px; }.curiosity-flavor { margin-bottom: 14px; }.event-choice-heading { flex-wrap: wrap; gap: 4px; }.curiosity-choice-btn { padding: 10px; gap: 8px; }.choice-effects > span { font-size: .5rem; }.event-footer { padding: 10px 13px calc(10px + env(safe-area-inset-bottom)); font-size: .56rem; }.event-footer > span:first-child { max-width: 210px; }.event-story h2 { font-size: 1.6rem; }
}
/* Cold moonlit stone and polished steel for the encounter window. */
.curiosity-modal { color:#e0ebf6;background:#20334d;border-color:#849bb7;box-shadow:inset 2px 2px #d9e8f333,inset -3px -3px #0d192b,0 12px 0 #0b1423,0 22px 50px #000b; }
.curiosity-header,.event-footer { background:#2c4361;border-color:#7089a7;box-shadow:inset 0 2px #c5dcf329; }
.event-location,.event-chapter { color:#afd7f3; }.event-location-dot { background:#75c9ed;border-color:#d9f4ff;box-shadow:0 0 4px #83d7f3; }
.curiosity-close { background:#304966;border-color:#8da8c4;box-shadow:inset 1px 1px #ffffff30,2px 2px #172338; }.curiosity-close:hover { background:#45658a; }
.event-illustration { background:repeating-linear-gradient(0deg,#243c5b 0 8px,#2b4667 8px 16px);border-right-color:#7e9cbb; }
.event-illustration::after { background:#3d5c7d;box-shadow:inset 0 3px #a6c5e0; }
.event-rune { border-color:#9cc9e677;box-shadow:3px 3px #172a43; }.event-star { color:#d5efff;background:#2b4566; }
.event-illustration-label { color:#b9d8ef;text-shadow:1px 1px #16243a; }
.event-chapter { color:#a9d5f3; }.event-story h2 { color:#e3f0fc;text-shadow:2px 2px #172942; }
.curiosity-flavor,.curiosity-resolution { color:#c1d3e4; }
.event-choice-heading > span { color:#d6e6f5; }.event-choice-heading small { color:#9eb8d2; }
.curiosity-choice-btn { border-color:#708dad;background:linear-gradient(#344e70,#293f5e);color:#e3edf8;box-shadow:inset 1px 1px #d2e6f638,inset -2px -2px #20334d,2px 3px #101d30; }
.curiosity-choice-btn:hover { background:linear-gradient(#456487,#304a6a);border-color:#b6dafa; }
.curiosity-choice-btn.risk,.curiosity-choice-btn.risk:hover { border-color:#8797bb;background:linear-gradient(#394768,#2a3958); }
.choice-number,.choice-arrow { color:#a9e2fa; }.choice-number { border-right-color:#91afcb; }
.choice-tone,.neutral .choice-tone { color:#a9d7f1; }.risk .choice-tone { color:#c3c8ef; }
.choice-effects > span { background:#1c2f49;border-color:#5e7d9e;color:#c5e2f2; }.risk .choice-effects > span { color:#d0d2ec;border-color:#7c8db0; }
.event-skip-note,.event-chosen { color:#a9bfd5; }.event-chosen strong { color:#cfe0f0; }
.event-result-tag { color:#bde9fb;border-color:#729bbd;background:#2a4563;box-shadow:2px 2px #172338; }.event-result-tag.ambush,.event-result-tag.punishment { color:#d4dafa;border-color:#8997bb;background:#354362; }
.event-result-lines { background:#1b304b;border-color:#6988a8;box-shadow:inset 1px 1px #c7e4fa22; }.event-result-lines > p { color:#d4e3f0; }.event-result-lines > p > span { color:#9edcf5; }
.curiosity-continue.danger { background:linear-gradient(#627b9d,#415b7d);border-color:#b5cde6;color:#f0f6fc; }
.event-wallet { color:#c2e7f8; }
.is-ambush .event-illustration { background:repeating-linear-gradient(0deg,#293955 0 8px,#344564 8px 16px); }
}
</style>
