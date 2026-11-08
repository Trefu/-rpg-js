<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { PARTY_EQUIPMENT, getPartyBonuses } from '@/core/items/equipment'
const game = useGameStore()
const owned = computed(() => PARTY_EQUIPMENT.filter(e => game.equipment.includes(e.id)))
const bonuses = computed(() => Object.entries(getPartyBonuses(game.equipment)))
const labels: Record<string, string> = { body: 'Cuerpo', mind: 'Mente', constitution: 'Constitución', agility: 'Agilidad', maxHealth: 'Vida máxima' }
</script>

<template>
  <section class="party-equipment">
    <div class="equipment-heading"><div><span>EL LEGADO DE VUESTROS VIAJES</span><h3>Equipo del grupo</h3></div><b>{{ owned.length }} / {{ PARTY_EQUIPMENT.length }}</b></div>
    <p>Mejoras permanentes para toda la compañía y sus futuros reclutas.</p>
    <div v-if="!owned.length" class="equipment-empty"><span aria-hidden="true">◇</span><p>Aún no lleváis reliquias del camino.<small>El mercader tiene algo que podría cambiar eso.</small></p></div>
    <ul v-else class="equipment-list"><li v-for="item in owned" :key="item.id"><img :src="item.icon" alt="" /><div><strong>{{ item.name }}</strong><small>{{ item.description }}</small></div><span class="equipment-active" title="Bonificación activa">✓</span></li></ul>
    <div v-if="bonuses.length" class="bonus-summary"><span v-for="[stat, value] in bonuses" :key="stat"><strong>+{{ value }}</strong> {{ labels[stat] }}</span></div>
  </section>
</template>

<style scoped>
.party-equipment { padding: 17px; border: 2px solid #88905b; border-radius: 3px; background: linear-gradient(#354432,#25372b); box-shadow:inset 2px 2px #d3cf8b35,inset -2px -2px #172319; color: #e5e5d3; }
.equipment-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; }.equipment-heading > div > span { font: 700 .52rem 'Courier New',monospace; letter-spacing: .08em; color: #d5bd61; }.equipment-heading h3 { font: 700 1.25rem Georgia, serif; color:#f0df9a; text-shadow:1px 2px #302719; margin: 5px 0 0; }.equipment-heading > b { font: 700 .62rem 'Courier New',monospace; color: #e5d793; border: 1px solid #9d9253; background:#2d392b; padding: 5px 7px; border-radius: 2px; white-space: nowrap; }
.party-equipment > p { font: .68rem/1.5 'Courier New',monospace; color: #c2c5a3; margin: 8px 0 15px; }
.equipment-empty { display: flex; align-items: center; gap: 13px; padding: 12px; border: 1px dashed #b3a65d; background:#283528; border-radius: 2px; }.equipment-empty > span { font-size: 1.8rem; color: #e1c85c; }.equipment-empty p { margin: 0; color: #dbd6a7; font:700 .7rem 'Courier New',monospace; line-height: 1.6; }.equipment-empty small { display: block; font-size: .6rem; color: #a9b18e; }
.equipment-list { padding: 0; margin: 0; list-style: none; display: grid; gap: 7px; }.equipment-list li { display: flex; gap: 10px; align-items: center; padding: 9px; background: #263429; border: 1px solid #8e8852; border-radius: 2px; box-shadow:inset 1px 1px #ffffff15; }.equipment-list img { width: 32px; height: 32px; object-fit: contain; image-rendering:pixelated; }.equipment-list strong { display: block; font:700 .73rem 'Courier New',monospace; }.equipment-list small { display: block; color: #b6bf98; font: .59rem/1.4 'Courier New',monospace; margin-top: 4px; }.equipment-active { margin-left: auto; color: #d1da76; font-size: .85rem; }
.bonus-summary { display: flex; flex-wrap: wrap; gap: 6px; padding-top: 13px; margin-top: 13px; border-top: 2px solid #817a49; }.bonus-summary > span { font: .61rem 'Courier New',monospace; color: #d4d1a0; background: #34412e; border: 1px solid #989454; padding: 5px 7px; border-radius: 2px; }.bonus-summary strong { color: #f0d975; font-weight: 700; }
@media (max-width: 720px) { .party-equipment { padding: 18px; }.equipment-heading > div > span { font-size: .48rem; } }
/* Match the blue steel equipment frame used by the campaign HUD. */
.party-equipment { border-color:#7189a7; background:linear-gradient(#304766,#263c5a 18px,#1f334e); box-shadow:inset 2px 2px #c2dbf333,inset -2px -2px #101c2e; }
.equipment-heading > div > span { color:#9ec6e8; }.equipment-heading h3 { color:#d6eaff; text-shadow:1px 2px #14263f; }.equipment-heading > b { color:#d6eaff; border-color:#7894b4; background:#253b58; }
.party-equipment > p { color:#b1c3d8; }.equipment-empty { border-color:#7894b4; background:#253b58; }.equipment-empty > span { color:#a9dafa; }.equipment-empty p { color:#d2e6f8; }.equipment-empty small { color:#a8bfd7; }
.equipment-list li { background:#283f5e; border-color:#718caf; }.equipment-list strong { color:#e0edfa; }.equipment-list small { color:#b6cbe0; }.equipment-active { color:#8dd8f2; }
.bonus-summary { border-top-color:#7189a7; }.bonus-summary > span { color:#c3d8ed; background:#2a4361; border-color:#718caf; }.bonus-summary strong { color:#9ee3ff; }
</style>
