<script setup lang="ts">
import { computed, ref } from 'vue'
import { MAX_HEROES, useGameStore } from '@/stores/game'
import PartyEquipment from './PartyEquipment.vue'
import { getInventoryEntries } from '@/core/items/inventory'
import { getItem } from '@/core/items/items'
import { ITEM_MAX_USES } from '@/core/items/items'
import { getExpedition, DEFAULT_EXPEDITION, listExpeditions } from '@/core/expeditions/registry'
import type { ExpeditionId } from '@/core/expeditions/types'
import GoldAmount from '@/components/ui/GoldAmount.vue'
import swordIcon from '@/assets/icons/crossed-swords.png'
import HeroStatChips from '@/components/combat/HeroStatChips.vue'
import { getAbilityIcon } from '@/core/abilities/getAbilityIcon'
import { formatPreviewRange } from '@/core/abilities/damagePipeline'
import mountainPreview from '@/assets/backgrounds/mountain-preview.png'

const game = useGameStore()
const difficultyLabels: Record<string, string> = { easy: 'Fácil', medium: 'Media', hard: 'Difícil' }
const selectedExpeditionId = ref<ExpeditionId>(DEFAULT_EXPEDITION)
const expedition = computed(() => getExpedition(selectedExpeditionId.value))
const destinations = computed(() => {
  const implemented = listExpeditions().map(config => ({
    id: config.id,
    name: config.displayName,
    description: config.description,
    difficulty: difficultyLabels[config.presentation.difficulty],
    inDevelopment: config.presentation.inDevelopment === true
  }))
  if (!implemented.some(destination => destination.id === 'crystal-caverns')) {
    implemented.push({
      id: 'crystal-caverns', name: 'Cavernas de Cristal',
      description: 'Una expedición entre vetas cristalinas. Próximamente.',
      difficulty: '—', inDevelopment: true
    })
  }
  return implemented
})
const selectedDestination = computed(() => destinations.value.find(destination => destination.id === selectedExpeditionId.value))
const selectedDestinationAvailable = computed(() => !!selectedDestination.value && !selectedDestination.value.inDevelopment)
const inventory = computed(() => getInventoryEntries(game.teamItems))
const classes: Record<string, string> = { warrior: 'Guerrero', cleric: 'Clériga', rogue: 'Pícaro' }
const slots = computed(() => Array.from({ length: MAX_HEROES }, (_, index) => game.activeHeroes[index] ?? null))
const selectedClasses = computed(() => new Set(game.activeHeroes.map(hero => hero.heroClassId)))
const readyToDepart = computed(() => game.activeHeroes.length > 0 && game.activeHeroes.length <= MAX_HEROES)
</script>

<template>
  <main class="camp-view campaign-shell">
    <div class="campaign-topline">
      <div class="campaign-purse"><GoldAmount :amount="game.gold" /></div>
    </div>
    <header class="camp-heading">
      <h1>Campamento</h1>
    </header>

    <section v-if="game.lastRun" class="run-summary campaign-panel" :class="{ victorious: game.lastRun.victory }">
      <div class="summary-emblem" aria-hidden="true">{{ game.lastRun.victory ? '✦' : '↟' }}</div>
      <div class="summary-copy"><span class="campaign-eyebrow">Resultado anterior</span><h2>{{ game.lastRun.victory ? 'Victoria' : 'Derrota' }}</h2><small v-if="game.lastRun.recruits.length">Reclutas: {{ game.lastRun.recruits.join(', ') }}</small></div>
      <div class="summary-rewards"><span><strong>{{ game.lastRun.combats }}</strong> victorias</span><span><strong>+{{ game.lastRun.xp }}</strong> XP en combates</span><span><GoldAmount :amount="`+${game.lastRun.gold}`" /></span></div>
    </section>

    <div class="camp-layout">
      <div class="camp-company-column">
        <section class="party-selection campaign-panel" aria-labelledby="party-selection-title">
          <div class="campaign-section-head"><h2 id="party-selection-title">Grupo de expedición</h2><span class="campaign-count">{{ game.activeHeroes.length }} / {{ MAX_HEROES }}</span></div>
          <ol class="party-slots">
            <li v-for="(hero, index) in slots" :key="index" :class="{ vacant: !hero }">
              <span class="party-slot-number">{{ index + 1 }}</span>
              <template v-if="hero"><img :src="hero.sprite" alt="" /><div><strong>{{ hero.name }}</strong><small>Nv. {{ hero.level }} · {{ classes[hero.heroClassId] ?? hero.heroClassId }}</small></div><button type="button" :aria-label="`Quitar a ${hero.name} del grupo`" @click="game.togglePartyHero(hero.heroClassId)">×</button></template>
              <span v-else class="party-empty">Sin seleccionar</span>
            </li>
          </ol>
          <p id="party-selection-hint" class="party-selection-hint">Selecciona entre 1 y {{ MAX_HEROES }} héroes de la compañía.</p>
        </section>
        <section class="company-section">
          <div class="campaign-section-head"><h2>Héroes disponibles</h2><span class="campaign-count">{{ game.companyHeroes.length }}</span></div>
          <div class="company">
            <article v-for="hero in game.companyHeroes" :key="hero.heroClassId" class="company-hero campaign-panel" :class="{ 'in-party': selectedClasses.has(hero.heroClassId) }">
                <div class="hero-portrait"><span class="hero-class">{{ classes[hero.heroClassId] ?? hero.heroClassId }}</span><img :src="hero.sprite" :alt="hero.name" /><span class="hero-level">{{ hero.level }}<small>NIVEL</small></span></div>
                <div class="hero-dossier"><h3>{{ hero.name }}</h3><div class="hero-vitals"><span><i class="vital-dot hp"></i>{{ hero.maxHealth }} HP</span><span><i class="vital-dot energy"></i>{{ hero.maxEnergy }} EN</span></div><div class="hero-xp-label"><span>Al siguiente nivel</span><strong>{{ hero.experience }} / {{ hero.experienceToNextLevel }} XP</strong></div><progress :value="hero.experience" :max="hero.experienceToNextLevel" :aria-label="`Experiencia de ${hero.name}`" /><div class="camp-hero-chips"><HeroStatChips :hero="hero" :show-all="true" tooltip-position="above" /></div></div>
                <details class="camp-hero-abilities"><summary>Habilidades · {{ hero.abilities.length }}</summary><ul><li v-for="ability in hero.abilities" :key="ability.type"><div><img :src="getAbilityIcon(ability.type)" alt="" /><strong>{{ ability.name }}</strong></div><p>{{ ability.description }}</p><p v-if="ability.previewDamage" class="camp-ability-preview">{{ ability.previewDamage(hero).kind === 'heal' ? 'Curación' : 'Daño' }}: {{ formatPreviewRange(ability.previewDamage(hero)) }}</p><div v-if="ability.previewDamage" class="camp-ability-formula" v-html="ability.previewDamage(hero).formula"></div></li></ul></details>
                <button type="button" class="campaign-button hero-party-toggle" :class="{ primary: selectedClasses.has(hero.heroClassId) }" :aria-pressed="selectedClasses.has(hero.heroClassId)" :aria-label="`${selectedClasses.has(hero.heroClassId) ? 'Quitar' : 'Añadir'} a ${hero.name} ${selectedClasses.has(hero.heroClassId) ? 'del' : 'al'} grupo`" :disabled="!selectedClasses.has(hero.heroClassId) && game.activeHeroes.length >= MAX_HEROES" @click="game.togglePartyHero(hero.heroClassId)">{{ selectedClasses.has(hero.heroClassId) ? '✓ En el grupo' : game.activeHeroes.length >= MAX_HEROES ? 'Grupo completo' : '+ Añadir al grupo' }}</button>
            </article>
          </div>
        </section>
        <PartyEquipment />
        <section class="camp-supplies campaign-panel">
          <div class="campaign-section-head"><h2>Inventario</h2><span class="campaign-count">{{ inventory.reduce((sum, e) => sum + e.count, 0) }} objetos</span></div>
          <div class="supply-list"><div v-for="entry in inventory" :key="entry.id" class="supply-item"><div class="supply-icon"><img :src="getItem(entry.id)?.icon" :alt="getItem(entry.id)?.name" /></div><div><strong>{{ getItem(entry.id)?.name }}</strong><small>{{ ITEM_MAX_USES[entry.id] ? 'Recargable' : 'Un solo uso' }}</small></div><span class="supply-count">×{{ entry.count }}</span></div><p v-if="!inventory.length" class="campaign-note">Sin objetos.</p></div>
        </section>
      </div>

      <aside class="camp-journey-column">
        <section class="destination-picker campaign-panel" aria-labelledby="destination-picker-title">
          <div class="campaign-section-head"><div><span class="campaign-eyebrow">Elige tu próximo viaje</span><h2 id="destination-picker-title">Expediciones</h2></div><span class="campaign-count">{{ destinations.length }}</span></div>
          <div class="destination-options">
            <button v-for="destination in destinations" :key="destination.id" type="button" class="destination-option" :class="{ selected: selectedExpeditionId === destination.id, unavailable: destination.inDevelopment }" :disabled="destination.inDevelopment" :aria-pressed="selectedExpeditionId === destination.id" @click="selectedExpeditionId = destination.id">
              <span class="destination-option-mark" aria-hidden="true">{{ selectedExpeditionId === destination.id ? '◆' : '◇' }}</span>
              <span class="destination-option-copy"><strong>{{ destination.name }}</strong><small>{{ destination.inDevelopment ? 'En desarrollo' : `Dificultad ${destination.difficulty}` }}</small></span>
              <span v-if="destination.inDevelopment" class="destination-soon">PRÓXIMAMENTE</span>
            </button>
          </div>
        </section>
        <section class="destination-card campaign-panel">
          <img v-if="selectedExpeditionId === 'mountain-peak'" class="mountain-preview" :src="mountainPreview" :alt="`${expedition.displayName}: paisaje de la expedición`" />
          <div class="destination-title"><img :src="swordIcon" alt="" /><div><span>{{ game.completedExpeditions.includes(expedition.id) ? 'COMPLETADA' : 'EXPEDICIÓN' }}</span><h2>{{ expedition.displayName }}</h2></div></div>
          <div class="destination-body"><p>Dificultad {{ difficultyLabels[expedition.presentation.difficulty] }}</p><div class="journey-progress"><div><span>Mejor avance</span><strong>{{ game.completedExpeditions.includes(expedition.id) ? 'Completada' : `Paso ${game.bestDepth}` }}</strong></div></div><button class="campaign-button primary camp-start" :disabled="!readyToDepart || !selectedDestinationAvailable" aria-describedby="party-selection-hint" @click="game.beginRun({ expeditionId: expedition.id })"><img :src="swordIcon" alt="" />Iniciar intento {{ game.attempts + 1 }}<span aria-hidden="true">→</span></button><p v-if="!readyToDepart" class="departure-hint">Selecciona al menos un héroe.</p></div>
        </section>
        <div class="camp-record"><div><strong>{{ game.attempts }}</strong><span>intentos iniciados</span></div><div><strong>{{ game.equipment.length }}</strong><span>mejoras permanentes</span></div></div>
      </aside>
    </div>
  </main>
</template>

<style scoped>
.camp-heading { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 22px; }
.destination-picker { padding: 14px; margin-bottom: 14px; }
.destination-picker .campaign-section-head { margin-bottom: 10px; }
.destination-picker h2 { margin-top: 3px; }
.destination-options { display: grid; gap: 8px; }
.destination-option { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 58px; padding: 9px; text-align: left; color: #dceaff; background: #1c304a; border: 1px solid #607f9e; cursor: pointer; }
.destination-option:hover:not(:disabled), .destination-option.selected { border-color: #9bd8f5; background: #294766; }
.destination-option:disabled { cursor: not-allowed; opacity: .62; }
.destination-option-mark { color: #a9dfff; font-size: 1rem; }
.destination-option-copy { display: grid; gap: 4px; min-width: 0; }
.destination-option-copy strong { font: 700 .76rem Georgia,serif; }
.destination-option-copy small { color: #a9c1d9; font: .55rem 'Courier New',monospace; }
.destination-soon { margin-left: auto; color: #9bb1c8; font: 700 .46rem 'Courier New',monospace; white-space: nowrap; }
.camp-heading p { margin: 0; }
.run-summary { display: flex; align-items: center; gap: 15px; padding: 15px; margin-bottom: 22px; border-color: #a28b51; background: linear-gradient(90deg, #504124, #283729 35%); }
.summary-emblem { font: 2rem Georgia, serif; color: #e2cb67; width: 43px; height: 49px; display: grid; place-items: center; border: 2px solid #a89352; background: #372f20; flex-shrink: 0; box-shadow: inset 2px 2px #ead58933, 2px 2px #111; }
.summary-copy { flex: 1; }.summary-copy h2 { font-size: 1.2rem; margin-top: 4px; }.summary-copy p { margin: 4px 0 0; color: #c0c3a1; font-size: .68rem; }.summary-copy small { color: #e0cc7a; font-size: .65rem; }
.summary-rewards { display: flex; gap: 14px; }.summary-rewards > span { display: flex; flex-direction: column; gap: 4px; color: #c6bd90; font-size: .55rem; }.summary-rewards strong { color: #efdc8b; font: 700 1.2rem 'Courier New', monospace; }.victorious { border-color: #c9b354; }
.camp-layout { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 21px; align-items: start; }.camp-company-column { display: grid; gap: 20px; min-width: 0; }.company { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }.company-hero { overflow: hidden; min-width: 0; }
.hero-portrait { position: relative; height: 152px; display: flex; justify-content: center; align-items: end; overflow: hidden; background: repeating-linear-gradient(90deg, transparent 0 24px, #abb7740a 24px 26px), linear-gradient(#263c31, #344638); border-bottom: 2px solid #82754c; }.hero-portrait::after { content: ''; position: absolute; inset: auto 0 0; height: 22px; background: linear-gradient(transparent, #223127); }.hero-portrait img { height: 135px; max-width: 100%; object-fit: contain; image-rendering: pixelated; filter: drop-shadow(2px 3px #121711); }
.hero-class { position: absolute; z-index: 1; left: 8px; top: 8px; font: 700 .52rem 'Courier New', monospace; text-transform: uppercase; color: #e8d782; background: #293322; border: 1px solid #aa9853; padding: 4px 5px; }.hero-level { position: absolute; right: 7px; bottom: 7px; z-index: 1; width: 35px; height: 39px; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #2d3023; border: 2px solid #bc9c48; color: #f1d573; font: 700 1rem 'Courier New', monospace; box-shadow: 2px 2px #111; }.hero-level small { font: 700 .39rem 'Courier New', monospace; margin-top: 1px; }
.hero-dossier { padding: 11px; }.hero-sheet-heading { display:flex;align-items:center;justify-content:space-between;gap:4px; }.hero-dossier h3 { margin: 0 0 8px; font: 700 1.15rem Georgia,serif; color:#f0df9a; }.hero-sheet-heading .hero-class { position:static;font-size:.43rem; }.hero-vitals { display: flex; gap: 10px; flex-wrap: wrap; font: 700 .6rem 'Courier New',monospace; color: #d6d3aa; }.hero-vitals span { display: flex; gap: 5px; align-items: center; }.vital-dot { width: 6px; height: 6px; background: #83bf61; border:1px solid #c0d27d; }.vital-dot.energy { background: #528ab6; border-color:#9bc4e4; }
.hero-xp-label { display: flex; justify-content: space-between; gap: 4px; font: .52rem 'Courier New',monospace; color: #c1bd92; margin: 12px 0 5px; }.hero-xp-label strong { color: #eadb97; font-weight: 700; }
progress { display: block; width: 100%; height: 8px; border: 2px solid #171e17; border-radius: 0; overflow: hidden; background: #172219; accent-color: #ccad49; }progress::-webkit-progress-bar { background: #172219; }progress::-webkit-progress-value { background: repeating-linear-gradient(90deg,#d5bc5b 0 7px,#988b43 7px 9px); }progress::-moz-progress-bar { background: #d5bc5b; }
.camp-hero-chips { margin-top: 10px; padding-top: 8px; border-top: 1px dashed #9da47762; }.camp-hero-chips :deep(.hero-stat-chips-stack) { gap: 5px; }.camp-hero-chips :deep(.stat-chip-section-label) { font: 700 .48rem 'Courier New',monospace; color: #d9c16a; }.camp-hero-chips :deep(.hero-stat-chips) { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 3px; }.camp-hero-chips :deep(.stat-chip) { justify-content:space-between; font-size:.57rem; padding:3px 4px; border-radius:2px; }.camp-hero-chips :deep(.stat-chip-tooltip) { z-index: 12000; }
.empty-slot { border-style: dashed; background: #1d2b21; display: flex; align-items: center; justify-content: center; }.empty-hero { text-align: center; padding: 20px 13px; color: #bac095; }.empty-hero > span { display: grid; place-items: center; font-size: 1.5rem; width: 40px; height: 40px; border: 2px dashed #a79c5c; background:#303521; margin: 0 auto 12px; color: #dfca67; }.empty-hero h3 { font: 700 .9rem Georgia,serif; color: #ead996; }
.camp-supplies { padding: 16px; }.supply-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }.supply-item { display: flex; gap: 8px; align-items: center; border: 1px solid #a99a5a70; padding: 8px; background: #29382a; min-width: 0; box-shadow: inset 1px 1px #c4bd8430; }.supply-icon { width: 37px; height: 37px; display: grid; place-items: center; background: #38402b; border:1px solid #827b4b; flex-shrink: 0; }.supply-icon img { width: 30px; height: 30px; image-rendering: pixelated; object-fit: contain; }.supply-item strong { display: block; font: 700 .64rem 'Courier New',monospace; }.supply-item small { display: block; font: .48rem 'Courier New',monospace; margin-top: 4px; color: #b1b794; }.supply-count { color: #f0d66f; margin-left: auto; font:700 .72rem 'Courier New',monospace; }
.camp-journey-column { position: sticky; top: 20px; }.destination-card { overflow: hidden; }.destination-art { height: 170px; position: relative; overflow:hidden; background: repeating-linear-gradient(0deg,#293b2d 0 8px,#2c4232 8px 16px); border-bottom:2px solid #ad9a50; }.destination-art::after { content:'';position:absolute;inset:auto 0 0;height:45px;background:repeating-linear-gradient(90deg,#1d3024 0 20px,#263b2a 20px 40px);clip-path:polygon(0 45%,12% 45%,12% 0,18% 0,18% 55%,34% 55%,34% 12%,41% 12%,41% 65%,60% 65%,60% 23%,67% 23%,67% 65%,83% 65%,83% 4%,89% 4%,89% 55%,100% 55%,100% 100%,0 100%);z-index:2; }
.pixel-moon { position:absolute;top:27px;right:32px;width:23px;height:23px;background:#f0dc87;box-shadow:0 0 0 5px #f0dc8720,0 0 15px #f0dc8740; }.mountain-back { position:absolute;inset:20px 0 10px;background:#5d7256;clip-path:polygon(0 100%,15% 45%,24% 73%,43% 5%,61% 70%,75% 25%,100% 100%);filter:drop-shadow(3px 3px #18271d); }.mountain-back::after { content:'';position:absolute;inset:0;background:#c9c692;clip-path:polygon(43% 5%,34% 31%,42% 26%,48% 36%,52% 32%,61% 70%); }.mountain-front { position:absolute;inset:45px 0 0;background:#40583e;clip-path:polygon(0 75%,19% 28%,34% 70%,52% 10%,74% 72%,91% 30%,100% 58%,100% 100%,0 100%); }.pine-tree { position:absolute;z-index:1;bottom:33px;width:0;height:0;border-left:12px solid transparent;border-right:12px solid transparent;border-bottom:40px solid #1d3826;filter:drop-shadow(2px 2px #121e15); }.pine-one {left:17%;}.pine-two {right:13%;transform:scale(1.3);bottom:38px;}.destination-status { position: absolute; z-index:3;top:10px;left:10px;color:#fae895;font:700 .47rem 'Courier New',monospace;background:#293421;border:2px solid #c0a64e;padding:5px 7px;box-shadow:2px 2px #151b13; }.destination-body { padding: 16px; }.destination-body h2 { font:700 1.45rem Georgia,serif; margin-top: 6px; }.destination-body > p { font: .66rem/1.55 'Courier New',monospace; color: #c2c3a0; }.destination-tags { display: flex; flex-wrap: wrap; gap: 5px; margin: 13px 0 17px; }.destination-tags span { font:700 .5rem 'Courier New',monospace; color:#d7cc98; border:1px solid #9e9055;background:#343b2b;padding:4px 5px; }.journey-progress { margin-bottom: 16px; }.journey-progress > div { display: flex; justify-content: space-between; font: .56rem 'Courier New',monospace; color: #c3c09a; margin-bottom: 6px; }.journey-progress strong { color: #f1d975; }.camp-start { width: 100%; }.camp-start span { margin-left: auto; font-size: 1rem; }.destination-body .destination-footnote { font: .5rem 'Courier New',monospace; text-align: center; margin: 9px 0 0; color: #aaaF8a; }
.camp-record { display: grid; grid-template-columns: 1fr 1fr; padding: 16px 0; border-bottom: 2px solid #777449; background:#202e23; }.camp-record > div { display: flex; align-items: center; flex-direction: column; gap: 5px; }.camp-record > div + div { border-left: 1px solid #76784c; }.camp-record strong { font: 700 1.35rem 'Courier New',monospace; color: #eed77a; }.camp-record span { font: .52rem 'Courier New',monospace; color: #b1b590; }.camp-persistence { padding: 15px 5px; border-bottom:1px dashed #8d8b5e; }.camp-persistence p { font: .6rem/1.55 'Courier New',monospace; color: #abb293; }.camp-footer { text-align: center; color: #c7b775; font: italic .75rem Georgia, serif; margin-top: 27px; padding: 12px; border-top: 1px solid #787244; }
@media (max-width: 1050px) { .camp-layout { grid-template-columns: minmax(0, 1fr) 270px; gap: 14px; }.company { grid-template-columns: repeat(2, minmax(0, 1fr)); }.company-hero.empty-slot:last-child { min-height: 160px; }.summary-rewards { gap: 10px; }.supply-list { grid-template-columns: 1fr; } }
@media (max-width: 720px) { .camp-heading { display: block; }.camp-save-badge { width:max-content; margin-top: 12px; }.camp-layout { display: flex; flex-direction: column; }.camp-journey-column { position: static; width: 100%; order: -1; }.destination-art { height: 130px; }.destination-body { padding: 14px; }.camp-record { padding: 13px 0; }.camp-persistence { display: none; }.company { grid-template-columns: repeat(2, minmax(0, 1fr)); }.hero-portrait { height: 120px; }.hero-portrait img { height: 108px; }.run-summary { padding: 11px; gap: 9px; flex-wrap: wrap; }.summary-emblem { width: 32px; height: 38px; }.summary-copy { min-width: 160px; }.summary-copy h2 { font-size: 1rem; }.summary-rewards { width: 100%; justify-content: space-between; padding-top: 10px; border-top: 1px solid #a18d4d; }.summary-rewards strong { font-size: 1rem; }.camp-supplies { padding: 11px; }.camp-company-column { width: 100%; gap: 15px; }.hero-xp-label { flex-wrap: wrap; }.camp-footer { margin-top: 17px; }.camp-hero-chips :deep(.hero-stat-chips) { grid-template-columns: 1fr; }.camp-hero-chips :deep(.stat-chip) { font-size:.53rem; } }
/* Expedition HUD palette: midnight blue, steel and ice. */
.run-summary { border-color: #7188a8; background: linear-gradient(90deg, #293c5b, #203550 35%); }
.summary-emblem { color: #b7d6f2; border-color: #7f9dbb; background: #263952; box-shadow: inset 2px 2px #dceaff33, 2px 2px #111; }
.summary-copy small, .summary-rewards strong { color: #c4e4ff; }
.summary-rewards > span { color: #a9c0d7; }
.victorious { border-color: #8baed0; }
.hero-portrait { background: repeating-linear-gradient(90deg, transparent 0 24px, #abb7740a 24px 26px), linear-gradient(#263a54, #344e6d); border-bottom-color: #7188a8; }
.hero-class { color: #d9ebfa; background: #293d58; border-color: #8ca9c5; }
.hero-level { background: #263b57; border-color: #94b7d8; color: #cce8ff; }
.hero-dossier h3 { color: #d9eaff; }
.hero-vitals { color: #c3d5e8; }
.vital-dot { background: #67c9ed; border-color: #b7edff; }
.vital-dot.energy { background: #718ce0; border-color: #bdcaff; }
.hero-xp-label { color: #acc0d7; }
.hero-xp-label strong { color: #d0e8ff; }
progress { background: #14233a; border-color: #111e30; accent-color: #75bfe8; }
progress::-webkit-progress-bar { background: #14233a; }
progress::-webkit-progress-value { background: repeating-linear-gradient(90deg,#91d4f3 0 7px,#5488bd 7px 9px); }
progress::-moz-progress-bar { background: #78bfe7; }
.camp-hero-chips { border-top-color: #7590b080; }
.camp-hero-chips :deep(.stat-chip-section-label) { color: #a9d9f4; }
.empty-slot { background: #1d2b43; }
.empty-hero { color: #b7c9dd; }
.empty-hero > span { border-color: #7da4c8; background: #263d5a; color: #b8e8ff; }
.empty-hero h3 { color: #d1e8fa; }
.camp-supplies { background: linear-gradient(#304766,#263c5a 18px,#1f334e); border-color: #708bad; }
.supply-item { border-color: #718caf; background: #283d59; box-shadow: inset 1px 1px #d9eaff30; }
.supply-icon { background: #334c6b; border-color: #7596b8; }
.supply-item strong { color: #e0edfa; }
.supply-item small { color: #aec4da; }
.supply-count { color: #bde8ff; }
.destination-title { background: repeating-linear-gradient(0deg,#304866 0 7px,#3a5573 7px 14px); border-bottom-color: #86aaca; }
.destination-title > img { width:30px;height:30px;object-fit:contain;image-rendering:pixelated; }
.destination-title > div > span { color: #b7dfff; }
.destination-title h2 { color: #e1efff; }
.destination-body > p, .journey-progress > div { color: #b6cce2; }
.journey-progress strong, .camp-record strong { color: #bde4ff; }
.camp-record { border-bottom-color: #7188a8; background: #203550; }
.camp-record > div + div { border-left-color: #7188a8; }
.camp-record span { color: #afc4da; }
.party-selection { padding:14px; }
.party-slots { display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;list-style:none;padding:0;margin:0; }
.party-slots li { display:flex;align-items:center;gap:7px;min-height:62px;border:1px solid #7899bc;background:#192d47;padding:7px;min-width:0; }
.party-slots li.vacant { border-style:dashed;color:#90a6bd; }
.party-slot-number { color:#9bcef0;font-size:.65rem; }
.party-slots img { width:30px;height:38px;object-fit:contain; }
.party-slots strong { display:block;font-size:.68rem;color:#e3eff9; }
.party-slots small { display:block;margin-top:4px;font-size:.5rem;color:#a8bed3; }
.party-slots li>div { min-width:0;flex:1; }
.party-slots button { align-self:start;margin-left:auto;background:#2e4765;border:1px solid #91acc9;color:#deedfa;cursor:pointer;width:22px;height:22px;flex-shrink:0; }
.party-empty { font-size:.58rem; }
.party-selection-hint { font-size:.62rem;color:#b4cbe0;margin:12px 0 0; }
.company-hero { display:flex;flex-direction:column; }
.company-hero.in-party { border-color:#9fd8fa;box-shadow:inset 2px 2px #c2dbf333,inset -2px -2px #101c2e,0 0 0 1px #6c9ec0; }
.hero-party-toggle { margin:8px;width:calc(100% - 16px);font-size:.62rem; }
.camp-hero-abilities { padding:8px;border-top:1px solid #6382a0;margin-top:auto;font-size:.6rem;color:#c9dced; }
.camp-hero-abilities summary { cursor:pointer;padding:4px 0;color:#a9d9f4; }
.camp-hero-abilities ul { margin:8px 0 0;padding:0;list-style:none; }
.camp-hero-abilities li { border:1px solid #637c97;background:#1a2b42;padding:8px;margin:7px 0; }
.camp-hero-abilities li>div:first-child { display:flex;align-items:center;gap:7px; }
.camp-hero-abilities img { width:22px;height:22px;object-fit:contain; }
.camp-hero-abilities p { line-height:1.6;color:#b6cade;font-size:.58rem; }
.camp-ability-preview { color:#ccecff !important;font-weight:bold; }
.camp-ability-formula { color:#b7cfe4;line-height:1.6;font-size:.58rem;overflow-wrap:anywhere; }
.mountain-preview { display:block;width:100%;aspect-ratio:9/12;object-fit:cover;object-position:center 30%;border-bottom:2px solid #86aaca; }
.departure-hint { color:#b6cce2;font-size:.6rem; }
.destination-title { display:flex;align-items:center;gap:10px;padding:12px; }
.destination-title h2 { font-size:1.25rem; }
.destination-body { padding:14px; }
@media(max-width:1050px){.party-slots{grid-template-columns:1fr}.party-slots li{min-height:48px}}
@media(max-width:720px){.party-slots{grid-template-columns:1fr}.party-selection{padding:10px}.mountain-preview{aspect-ratio:16/9;object-position:center 18%}.camp-layout{display:flex;flex-direction:column}.camp-journey-column{order:0}.hero-party-toggle{font-size:.55rem;padding:8px 5px}.camp-hero-abilities summary{font-size:.55rem}}
@media (max-width: 360px) { .company { grid-template-columns: 1fr; }.camp-hero-chips :deep(.hero-stat-chips) { grid-template-columns: repeat(2,minmax(0,1fr)); } }
</style>
