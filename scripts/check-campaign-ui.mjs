import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const server = await createServer({ server: { port: 5189, strictPort: true } })
await server.listen()
let browser
try {
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('http://localhost:5189')
  await page.locator('.camp-view').waitFor()
  assert.equal(await page.locator('.company-hero').count(), 3)
  assert.equal(await page.getByRole('button', { name: /Iniciar intento 1/ }).isDisabled(), false)
  assert.equal(await page.locator('#party-selection .company-hero').count(), 3)
  await page.evaluate(() => window.__gameStore.setPartyHeroes([]))
  await page.reload()
  await page.locator('.camp-view').waitFor()
  assert.equal(await page.locator('.camp-empty-slot').count(), 3)
  assert.equal(await page.getByRole('button', { name: /Iniciar intento 1/ }).isDisabled(), true)
  await page.evaluate(() => window.__gameStore.setPartyHeroes(['rogue', 'warrior', 'cleric']))
  await page.getByRole('button', { name: 'Quitar a Elara del grupo', exact: true }).click()
  assert.deepEqual(await page.evaluate(() => window.__gameStore.activeHeroes.map(hero => hero.heroClassId)), ['rogue', 'warrior'])
  await page.reload()
  await page.locator('.camp-view').waitFor()
  assert.deepEqual(await page.evaluate(() => window.__gameStore.activeHeroes.map(hero => hero.heroClassId)), ['rogue', 'warrior'])
  assert.equal(await page.locator('.company-hero').count(), 3)
  await page.getByRole('button', { name: 'Quitar a Bjorn del grupo', exact: true }).first().click()
  assert.deepEqual(await page.evaluate(() => window.__gameStore.activeHeroes.map(hero => hero.heroClassId)), ['rogue'])
  await page.getByRole('button', { name: 'Añadir a Elara al grupo', exact: true }).click()
  await page.getByRole('button', { name: 'Añadir a Bjorn al grupo', exact: true }).click()
  assert.equal(await page.evaluate(() => window.__gameStore.activeHeroes.length), 3)
  assert.equal(await page.locator('.mountain-preview').evaluate(img => img.complete && img.naturalWidth > 0), true)
  await page.evaluate(async () => {
    const { Warrior } = await import('/src/core/heroes/Warrior.ts')
    const { Cleric } = await import('/src/core/heroes/Cleric.ts')
    const { Rogue } = await import('/src/core/heroes/Rogue.ts')
    const { MOUNTAIN_PEAK } = await import('/src/core/expeditions/mountainPeak.ts')
    MOUNTAIN_PEAK.generator.haunting.chance = 0
    const game = window.__gameStore
    game.startGame([Warrior.createStarter(), Cleric.createStarter(), Rogue.createStarter()])
    for (const hero of game.activeHeroes) hero.gainExperience(350)
    game.attempts = 2
    game.bestDepth = 6
    game.gold = 220
    game.equipment = ['vigor-banner', 'whetstone']
    game.applyEquipment()
    game.runRewards = { combats: 4, xp: 206, gold: 80, recruits: ['Dagel'] }
    game.finishRun(false)
  })
  const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  const screenshot = async name => {
    if (process.env.CAMPAIGN_SCREENSHOTS) await page.screenshot({ path: `${process.env.CAMPAIGN_SCREENSHOTS}/${name}.png`, fullPage: true })
  }
  await page.locator('.camp-view').waitFor()
  assert.equal(await page.locator('.camp-view .campaign-breadcrumb').count(), 0)
  assert.equal(await page.locator('.destination-art, .mountain-back, .mountain-front, .pixel-moon').count(), 0)
  const campText = await page.locator('.camp-view').innerText()
  assert.doesNotMatch(campText, /Un fuego|La montaña sigue ahí|Una historia por conocer|Cada intento deja huella|El fuego permanece/)
  await page.locator('button.camp-hero-attributes').first().click()
  assert.equal(await page.locator('.camp-hero-chips .stat-chip').count(), 11)
  assert.equal(await page.locator('.camp-hero-chips .stat-chip-section-label').count(), 1)
  await page.locator('.camp-hero-chips .stat-chip').first().hover()
  assert.equal(await page.locator('.stat-chip-tooltip').isVisible(), true)
  await page.keyboard.press('Escape')
  await noOverflow()
  await screenshot('campaign-camp-desktop')
  await page.setViewportSize({ width: 390, height: 844 })
  await noOverflow()
  await screenshot('campaign-camp-mobile')
  await page.getByRole('button', { name: /Iniciar intento 3/ }).click()
  await page.locator('.expedition-map').waitFor()
  assert.equal(await page.locator('.campaign-breadcrumb').count(), 0)
  assert.equal(await page.evaluate(() => window.__expeditionStore.currentExpedition.nodes.some(node => node.type === 'recruit-hero')), false)
  assert.ok(await page.evaluate(() => new Set(window.__expeditionStore.currentExpedition.nodes.map(node => node.depth)).size > 10))
  const previewState = await page.evaluate(() => {
    const expedition = window.__expeditionStore
    const node = expedition.currentExpedition.nodes.find(node => node.id === 'start')
    return { selected: expedition.selectedNode.id, available: [...expedition.availableNodes], gold: window.__gameStore.gold,
      xp: node.enemies.reduce((sum, enemy) => sum + enemy.experienceReward, 0),
      minGold: node.enemies.reduce((sum, enemy) => sum + enemy.goldReward.min, 0),
      maxGold: node.enemies.reduce((sum, enemy) => sum + enemy.goldReward.max, 0),
      enemies: node.enemies.length }
  })
  await page.locator('.map-node.available').first().click()
  await page.getByRole('dialog', { name: 'Combate', exact: true }).waitFor()
  assert.equal(await page.locator('.combat-preview h2, .combat-preview .campaign-count, .preview-enemy-info small').count(), 0)
  assert.doesNotMatch(await page.locator('.combat-preview').innerText(), /Comparar otros caminos|Confirma para entrar|Vista previa de combate|Próximo:/)
  assert.equal(await page.locator('.preview-enemies li').count(), previewState.enemies)
  assert.equal(await page.locator('.preview-xp').innerText(), `${previewState.xp} XP`)
  assert.equal(await page.locator('.preview-gold').innerText(), `${previewState.minGold}–${previewState.maxGold}`)
  assert.equal(await page.evaluate(() => window.__gameStore.currentLocation), 'expedition-map')
  assert.equal(await page.evaluate(() => window.__gameStore.gold), previewState.gold)
  await page.keyboard.press('Tab')
  assert.equal(await page.evaluate(() => !!document.activeElement.closest('.combat-preview')), true)
  await noOverflow()
  await screenshot('campaign-combat-preview-mobile')
  await page.getByRole('button', { name: 'Cerrar vista previa' }).click()
  assert.equal(await page.evaluate(() => window.__expeditionStore.selectedNode.id), previewState.selected)
  assert.deepEqual(await page.evaluate(() => [...window.__expeditionStore.availableNodes]), previewState.available)
  // Explore two alternative routes; neither inspection commits the selection.
  await page.evaluate(() => {
    const expedition = window.__expeditionStore
    for (const id of ['start', 'extra-start']) expedition.completeNode(id)
    expedition.selectNode(expedition.currentExpedition.nodes.find(node => node.id === 'extra-start'))
  })
  const availablePaths = await page.locator('.map-node.available').count()
  assert.ok(availablePaths >= 1 && availablePaths <= 4)
  for (let index = 0; index < Math.min(2, availablePaths); index++) {
    await page.locator('.map-node.available').nth(index).click()
    await page.locator('.combat-preview').waitFor()
    await page.keyboard.press('Escape')
    await page.locator('.combat-preview').waitFor({ state: 'hidden' })
    assert.equal(await page.evaluate(() => window.__expeditionStore.selectedNode.id), 'extra-start')
  }
  await page.evaluate(() => window.__gameStore.openShop('ui-merchant'))
  await page.locator('.shop-view').waitFor()
  assert.equal(await page.locator('.campaign-breadcrumb').count(), 0)
  assert.equal(await page.locator('.shop-product').count(), 9)
  await page.getByRole('button', { name: 'Comprar Poción de curación por 18 oro' }).click()
  assert.match(await page.locator('.shop-receipt').innerText(), /Has adquirido Poción de curación/)
  assert.equal(await page.evaluate(() => window.__gameStore.shopStock['healing-potion']), 2)
  await page.getByRole('button', { name: 'Consumibles 4', exact: true }).click()
  assert.equal(await page.locator('.shop-product').count(), 4)
  await page.getByRole('button', { name: 'Equipo del grupo 5', exact: true }).click()
  assert.equal(await page.locator('.shop-product').count(), 5)
  await page.getByRole('button', { name: 'Todo el puesto 9', exact: true }).click()
  await noOverflow()
  await screenshot('campaign-shop-mobile')
  await page.setViewportSize({ width: 1366, height: 900 })
  await page.locator('.npc-portrait img').waitFor()
  assert.equal(await page.locator('.npc-portrait img').evaluate(img => img.complete && img.naturalWidth > 0), true)
  assert.equal(await page.locator('img[src*="forest-wanderer"]').count(), 0)
  await noOverflow()
  await screenshot('campaign-shop-desktop')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.waitForTimeout(150)
  assert.match(await page.locator('.npc-portrait img').evaluate(img => img.currentSrc), /forest-merchant\.png/)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.getByRole('button', { name: /Continuar la expedición/ }).click()

  const openEvent = async id => {
    await page.evaluate(async eventId => {
      const { getExpedition } = await import('/src/core/expeditions/registry.ts')
      const expedition = window.__expeditionStore
      const source = getExpedition('mountain-peak')
      expedition.currentExpedition.config = { ...source, curiosityEvents: [source.curiosityEvents.find(event => event.id === eventId)] }
      const parent = expedition.currentExpedition.nodes.find(node => node.id === 'node-5')
      const target = expedition.currentExpedition.nodes.find(node => node.id === 'node-6')
      expedition.currentExpedition.nodes.find(node => node.id === 'start').completed = true
      target.completed = false
      parent.completed = true
      parent.connections = [target.id]
      expedition.selectedNode = parent
      window.__gameStore.navigateTo('expedition-map')
    }, id)
    await page.locator('.map-node.available').first().click()
    await page.getByRole('dialog').waitFor()
  }
  await openEvent('abandoned-cache')
  assert.equal(await page.locator('.campaign-breadcrumb').count(), 0)
  assert.equal(await page.locator('.curiosity-choice-btn').count(), 2)
  await screenshot('campaign-event-desktop')
  await page.keyboard.press('Tab')
  assert.equal(await page.evaluate(() => !!document.activeElement.closest('.curiosity-modal')), true)
  await page.setViewportSize({ width: 390, height: 844 })
  await noOverflow()
  await screenshot('campaign-event-mobile')
  const before = await page.evaluate(() => window.__gameStore.teamItems.filter(id => id === 'bandages').length)
  await page.locator('.curiosity-choice-btn').first().click()
  await page.locator('.event-result-lines').waitFor()
  assert.equal(await page.evaluate(() => window.__gameStore.teamItems.filter(id => id === 'bandages').length), before + 1)
  await screenshot('campaign-event-result')
  await page.getByRole('button', { name: 'Seguir el camino' }).click()
  await page.getByRole('dialog').waitFor({ state: 'hidden' })
  await openEvent('patrol-bounty')
  await page.locator('.curiosity-choice-btn').first().click()
  assert.equal(await page.getByRole('button', { name: 'Cerrar evento' }).isDisabled(), true)
  await page.keyboard.press('Escape')
  assert.equal(await page.getByRole('dialog').isVisible(), true)
  await page.getByRole('button', { name: 'Enfrentar el combate' }).click()
  await page.getByRole('dialog').waitFor({ state: 'hidden' })
  await page.locator('.enemy-card').first().waitFor()
  assert.equal(await page.evaluate(() => window.__expeditionStore.selectedNode.enemies.every(enemy => enemy.enemyGroup === 'bandits')), true)
  assert.deepEqual(errors, [])
  console.log('OK: campaña y tienda adaptables, compras y filtros, NPC animado y movimiento reducido, eventos con consecuencias, teclado y emboscadas.')
} finally {
  await browser?.close()
  await server.close()
}
