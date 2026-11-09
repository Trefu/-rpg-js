<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore } from '@/stores/game'
import { PARTY_EQUIPMENT } from '@/core/items/equipment'
import { SHOP_CONSUMABLES } from '@/core/items/shop'
import { getItemOrThrow } from '@/core/items/items'
import { getInventoryEntries } from '@/core/items/inventory'
import { NPCS } from '@/core/npcs'
import GoldAmount from '@/components/ui/GoldAmount.vue'
import NpcPortrait from './NpcPortrait.vue'
import PartyEquipment from './PartyEquipment.vue'
import { useMediaQuery } from '@/composables/useMediaQuery'

const game = useGameStore()
defineEmits<{ (e: 'close'): void }>()
const category = ref<'all' | 'consumables' | 'equipment'>('all')
const receipt = ref('')
const merchant = NPCS['forest-merchant']
const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
const motionPreferenceKey = 'rpg-js-merchant-animation'
function readMotionPreference(): boolean | undefined {
  try {
    const saved = localStorage.getItem(motionPreferenceKey)
    return saved === 'play' ? true : saved === 'pause' ? false : undefined
  } catch { return undefined }
}
const merchantAnimation = ref<boolean | undefined>(readMotionPreference())
const merchantIsAnimated = computed(() => merchantAnimation.value ?? !reducedMotion.value)
function toggleMerchantAnimation() {
  merchantAnimation.value = !merchantIsAnimated.value
  try { localStorage.setItem(motionPreferenceKey, merchantAnimation.value ? 'play' : 'pause') } catch { /* Storage may be disabled. */ }
}
const inventory = computed(() => getInventoryEntries(game.teamItems))
const categories = [
  { id: 'all', label: 'Todo el puesto', count: SHOP_CONSUMABLES.length + PARTY_EQUIPMENT.length },
  { id: 'consumables', label: 'Consumibles', count: SHOP_CONSUMABLES.length },
  { id: 'equipment', label: 'Equipo del grupo', count: PARTY_EQUIPMENT.length }
] as const

function buy(id: string, name: string) {
  if (game.buyItem(id)) receipt.value = `Has adquirido ${name}. Ya está en la bolsa de la compañía.`
}
function potionLabel(id: string, price: number) {
  if (!game.shopStock[id]) return 'Agotado'
  return game.gold < price ? `Faltan ${price - game.gold}` : 'Comprar'
}
</script>

<template>
  <main class="shop-view campaign-shell">
    <div class="campaign-topline">
      <div class="campaign-purse"><GoldAmount :amount="game.gold" /></div>
    </div>
    <header class="shop-heading">
      <h1>El mercader del paso</h1>
      <button class="campaign-button shop-back" @click="$emit('close')">← Volver al camino</button>
    </header>

    <div class="shop-layout">
      <aside class="merchant-column">
        <section class="merchant-card campaign-panel">
          <div class="merchant-scene">
            <span class="merchant-sign">ABIERTO</span>
            <NpcPortrait npc-id="forest-merchant" :animated="merchantAnimation" />
            <button type="button" class="merchant-motion" :aria-pressed="merchantIsAnimated" @click="toggleMerchantAnimation">{{ merchantIsAnimated ? 'Pausar animación' : 'Animar vendedor' }}</button>
            <span class="merchant-ground" aria-hidden="true"></span>
          </div>
          <div class="merchant-intro">
            <span class="merchant-role">{{ merchant.title }}</span>
            <h2>{{ merchant.name }}</h2>
            <blockquote>«No puedo caminar por vosotros, pero sí asegurarme de que llevéis algo más que buenas intenciones.»</blockquote>
          </div>
        </section>
        <section class="shop-bag campaign-panel">
          <div class="campaign-section-head"><h2>Tu bolsa</h2><span class="campaign-count">{{ inventory.reduce((sum, e) => sum + e.count, 0) }} uds.</span></div>
          <div class="bag-items">
            <div v-for="entry in inventory" :key="entry.id" class="bag-item" :title="getItemOrThrow(entry.id).name">
              <img :src="getItemOrThrow(entry.id).icon" :alt="getItemOrThrow(entry.id).name" /><span>×{{ entry.count }}</span>
            </div>
            <p v-if="!inventory.length" class="campaign-note">La bolsa está vacía.</p>
          </div>
          <p class="campaign-note">Los frascos básicos se recargan tras cada victoria. Las unidades compradas se gastan al usarlas.</p>
        </section>
      </aside>

      <div class="shop-catalogue">
        <nav class="shop-tabs" aria-label="Categorías de tienda">
          <button v-for="tab in categories" :key="tab.id" :aria-pressed="category === tab.id" :class="{ active: category === tab.id }" @click="category = tab.id">{{ tab.label }} <span>{{ tab.count }}</span></button>
        </nav>
        <p class="shop-receipt" role="status" aria-live="polite">{{ receipt || 'Cada compra se conserva al terminar el intento.' }}</p>

        <section v-if="category !== 'equipment'" class="shop-section">
          <div class="campaign-section-head"><h2>Botica</h2><span class="campaign-count">Un solo uso</span></div>
          <div class="shop-grid">
            <article v-for="product in SHOP_CONSUMABLES" :key="product.id" class="shop-product campaign-panel" :class="{ exhausted: !game.shopStock[product.id] }">
              <div class="product-top"><div class="campaign-item-icon potion"><img :src="getItemOrThrow(product.id).icon" :alt="getItemOrThrow(product.id).name" /></div><span class="product-kind">CONSUMIBLE</span></div>
              <h3>{{ getItemOrThrow(product.id).name }}</h3>
              <p>{{ getItemOrThrow(product.id).description }}</p>
              <div class="product-stock"><span class="stock-dot" :class="{ empty: !game.shopStock[product.id] }"></span>{{ game.shopStock[product.id] ?? 0 }} disponibles</div>
              <div class="product-bottom"><span class="product-price"><GoldAmount :amount="product.price" /></span><button class="campaign-button" :disabled="game.gold < product.price || !game.shopStock[product.id]" :aria-label="`Comprar ${getItemOrThrow(product.id).name} por ${product.price} oro`" @click="buy(product.id, getItemOrThrow(product.id).name)">{{ potionLabel(product.id, product.price) }}</button></div>
            </article>
          </div>
        </section>

        <section v-if="category !== 'consumables'" class="shop-section">
          <div class="campaign-section-head"><h2>Equipo de compañía</h2><span class="campaign-count">Permanente</span></div>
          <div class="shop-grid">
            <article v-for="product in PARTY_EQUIPMENT" :key="product.id" class="shop-product equipment-product campaign-panel" :class="{ acquired: game.equipment.includes(product.id) }">
              <div class="product-top"><div class="campaign-item-icon"><img :src="product.icon" alt="" /></div><span class="product-kind">{{ game.equipment.includes(product.id) ? 'EN LA COMPAÑÍA' : 'OBJETO ÚNICO' }}</span></div>
              <h3>{{ product.name }}</h3><p>{{ product.description }}</p>
              <div class="product-stock">{{ game.equipment.includes(product.id) ? '✓ Bonificación activa' : 'Se conserva entre intentos' }}</div>
              <div class="product-bottom"><span class="product-price"><GoldAmount :amount="product.price" /></span><button class="campaign-button" :disabled="game.gold < product.price || game.equipment.includes(product.id)" :aria-label="`Comprar ${product.name} por ${product.price} oro`" @click="buy(product.id, product.name)">{{ game.equipment.includes(product.id) ? 'Ya adquirido' : game.gold < product.price ? `Faltan ${product.price - game.gold}` : 'Comprar' }}</button></div>
            </article>
          </div>
        </section>
        <PartyEquipment />
        <footer class="shop-footer"><button class="campaign-button primary leave" @click="$emit('close')">Continuar la expedición <span aria-hidden="true">→</span></button></footer>
      </div>
    </div>
  </main>
</template>

<style scoped>
@layer menu-legacy {
.shop-heading { margin-bottom: 32px; position: relative; padding-right: 190px; }
.shop-back { position: absolute; right: 0; bottom: 0; }
.shop-heading > p { margin: 0; }
.shop-layout { display: grid; grid-template-columns: 265px minmax(0, 1fr); gap: 30px; align-items: start; }
.merchant-column { position: sticky; top: 24px; display: grid; gap: 18px; }
.merchant-card { overflow: hidden; }
.merchant-scene { height: 225px; position: relative; display: flex; justify-content: center; align-items: end; overflow: hidden; background: repeating-linear-gradient(90deg, transparent 0 28px, #293b2c 28px 36px, #17281e 36px 43px), linear-gradient(#435236, #243728); border-bottom: 3px solid #b3974c; }
.merchant-scene::before { content: ''; position: absolute; inset: 0 0 auto; height: 16px; background: repeating-linear-gradient(90deg,#c6ac58 0 10px,#51472a 10px 20px); border-bottom: 3px solid #171f16; }
.merchant-scene::after { content: ''; position: absolute; inset: auto 0 0; height: 48px; background: repeating-linear-gradient(90deg,#223527 0 22px,#31452f 22px 44px); clip-path: polygon(0 35%,13% 35%,13% 0,19% 0,19% 55%,36% 55%,36% 12%,42% 12%,42% 70%,61% 70%,61% 17%,67% 17%,67% 70%,84% 70%,84% 8%,90% 8%,90% 52%,100% 52%,100% 100%,0 100%); z-index: 1; }
.merchant-scene .npc-portrait { position: relative; height: 155px; width: 190px; z-index: 2; margin-bottom: 28px; }
.merchant-aura { position: absolute; border: 2px dashed #b5a45357; width: 132px; height: 132px; border-radius: 2px; transform: rotate(45deg); top: 45px; box-shadow: 4px 4px #162216; }
.merchant-sign { position: absolute; z-index: 3; top: 24px; left: 12px; color: #f2dc77; font: 700 .55rem 'Courier New',monospace; border: 2px solid #ad9851; padding: 5px 8px; background: #263524; box-shadow: 2px 2px #111a12; }
.merchant-ground { position: absolute; bottom: 18px; width: 150px; height: 16px; background: #07170b70; border-radius: 50%; }
.merchant-intro { padding: 22px; }
.merchant-intro h2 { font-size: 1.8rem; margin-top: 5px; }
.merchant-intro blockquote { margin: 15px 0 20px; color: #b8c0ac; font: italic .9rem/1.7 Georgia, serif; }
.merchant-facts { display: flex; flex-wrap: wrap; gap: 7px; }
.merchant-facts span { border: 1px solid #a6b08a55; padding: 5px 7px; border-radius: 1px; font: .55rem 'Courier New',monospace; color: #c9c18e; background:#303c2d; }
.shop-bag { padding: 19px; }
.shop-bag h2 { font-size: 1.05rem; }
.bag-items { display: flex; flex-wrap: wrap; gap: 8px; }
.bag-item { display: flex; align-items: center; gap: 4px; background: #202d22; border: 1px solid #a49456; padding: 5px; border-radius: 2px; box-shadow: inset 1px 1px #eee0a022; }
.bag-item img { width: 25px; height: 25px; object-fit: contain; image-rendering: pixelated; }
.bag-item span { color: #c2c9af; font-size: .65rem; }
.shop-tabs { display: flex; gap: 5px; border-bottom: 1px solid #b6c3a021; padding-bottom: 12px; }
.shop-tabs button { display: flex; align-items: center; gap: 8px; border: 2px solid #7d794a; background: #2a382c; color: #c2c39c; border-radius: 2px; padding: 9px 11px; font: 700 .67rem 'Courier New',monospace; cursor: pointer; box-shadow: inset 1px 1px #d4d09a27, 2px 2px #111b13; }
.shop-tabs button.active { color: #f3dc78; border-color: #d1b456; background: #475037; }
.shop-tabs span { font-size: .58rem; color: #dfd093; }
.shop-receipt { min-height: 22px; font-size: .72rem; color: #b3c7a6; margin: 13px 0 27px; }
.shop-section { margin-bottom: 34px; }
.shop-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.shop-product { padding: 16px; display: flex; flex-direction: column; transition: border-color .2s; }
.shop-product:hover { border-color: #d5bd61; }
.product-top { display: flex; align-items: start; justify-content: space-between; gap: 8px; }
.product-kind { font-size: .5rem; letter-spacing: .1em; color: #a9b594; padding-top: 7px; }
.shop-product h3 { font-size: 1.05rem; margin: 13px 0 7px; font-weight: 700; color:#f0df9a; }
.shop-product > p { margin: 0 0 15px; color: #c0c3a3; font: .66rem/1.5 'Courier New',monospace; flex: 1; }
.product-stock { display: flex; gap: 6px; align-items: center; font: .6rem 'Courier New',monospace; color: #c2c39e; margin-bottom: 12px; }
.stock-dot { width: 5px; height: 5px; border-radius: 50%; background: #99bb78; }
.stock-dot.empty { background: #82796c; }
.product-bottom { display: flex; gap: 9px; align-items: center; justify-content: space-between; border-top: 2px solid #807849; padding-top: 11px; }
.product-price { color: #d8bc7d; display: flex; align-items: center; gap: 6px; font: 500 1.05rem Georgia, serif; }
.product-bottom button { padding: 9px 12px; min-height: 36px; font-size: .68rem; }
.equipment-product .campaign-item-icon img { width: 32px; height: 32px; }
.acquired { border-color: #bda34c; background: #34422c; }
.acquired .product-kind { color: #bdd49b; }
.exhausted .campaign-item-icon { opacity: .45; }
.shop-footer { display: flex; justify-content: space-between; align-items: center; gap: 18px; padding-top: 24px; margin-top: 18px; border-top: 1px solid #b6c3a021; }
.leave { flex-shrink: 0; }
@media (max-width: 960px) { .shop-layout { grid-template-columns: 220px minmax(0, 1fr); gap: 20px; } .shop-product { padding: 15px; } .product-kind { font-size: .45rem; } .shop-footer { flex-direction: column; align-items: stretch; } }
@media (max-width: 720px) {
  .shop-heading { margin-bottom: 22px; padding-right: 0; }
  .shop-back { position: static; margin-top: 16px; min-height: 36px; font-size: .7rem; }
  .shop-layout { grid-template-columns: minmax(0, 1fr); gap: 24px; }
  .merchant-column { position: static; display: block; }
  .merchant-card { display: grid; grid-template-columns: 120px minmax(0, 1fr); }
  .merchant-scene { height: 100%; min-height: 190px; }
  .merchant-scene .npc-portrait { width: 130px; height: 103px; margin-bottom: 34px; }
  .merchant-aura { width: 120px; height: 120px; top: 45px; }
  .merchant-intro { padding: 18px 15px; }
  .merchant-intro h2 { font-size: 1.5rem; }
  .merchant-intro blockquote { font-size: .78rem; margin: 10px 0; }
  .merchant-role { font-size: .5rem; }
  .merchant-facts { display: none; }
  .shop-bag { display: none; }
  .shop-tabs { gap: 0; }
  .shop-tabs button { padding: 10px 9px; font-size: .65rem; gap: 5px; }
  .shop-grid { gap: 10px; }
  .shop-product { padding: 14px; }
  .shop-product h3 { font-size: 1rem; }
  .shop-product > p { font-size: .7rem; }
  .product-kind { display: none; }
  .product-bottom { flex-wrap: wrap; }
  .product-bottom button { width: 100%; }
  .campaign-item-icon { width: 56px; height: 56px; }
  .campaign-count { font-size: .6rem; }
}
@media (max-width: 360px) { .shop-grid { grid-template-columns: 1fr; } }

/* Midnight-blue merchant stall with icy steel trim. */
.merchant-scene { background: repeating-linear-gradient(90deg, transparent 0 28px, #263952 28px 36px, #172941 36px 43px), linear-gradient(#405b79, #243b58); border-bottom-color:#91b6d8; }
.merchant-scene::before { background:repeating-linear-gradient(90deg,#89a9c6 0 10px,#354d69 10px 20px); border-bottom-color:#101c2e; }
.merchant-scene::after { background:repeating-linear-gradient(90deg,#1a304b 0 22px,#2b4563 22px 44px); }
.merchant-aura { border-color:#8ec9ec75; box-shadow:4px 4px #101d31; }
.merchant-sign { color:#c8e9ff; border-color:#91b9db; background:#263b56; }
.merchant-ground { background:#0b192ccc; }
.merchant-intro blockquote { color:#bdcfe2; }
.merchant-facts span { border-color:#718caf; color:#c3d8ed; background:#304763; }
.bag-item { background:#20334d; border-color:#718caf; box-shadow:inset 1px 1px #d9ecff33; }
.bag-item span,.shop-receipt { color:#b8dcf5; }
.shop-tabs { border-bottom-color:#7089a766; }
.shop-tabs button { border-color:#627c9c; background:#273e5d; color:#b7cbe0; }
.shop-tabs button.active { color:#dcf2ff; border-color:#a9dafa; background:#3a5c7e; }
.shop-tabs span { color:#c9e5fb; }
.shop-product:hover { border-color:#9fd9f5; }
.product-kind { color:#a9c6df; }
.shop-product h3 { color:#d9edff; }
.shop-product > p,.product-stock { color:#b2c6db; }
.stock-dot { background:#68c6e8; }
.stock-dot.empty { background:#63758a; }
.product-bottom { border-top-color:#6e87a6; }
.product-price { color:#b8e4ff; }
.acquired { border-color:#82b9dd; background:#2d4562; }
.acquired .product-kind { color:#bde8ff; }
.shop-footer { border-top-color:#6e87a6; }
}
</style>
