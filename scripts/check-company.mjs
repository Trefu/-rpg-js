import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { chromium } from 'playwright'

// Browser integration fixtures speed up victories and force a final defeat;
// normal encounter difficulty is exercised separately by mountainBalance.test.ts.
const server = await createServer({ server: { port: 5187, strictPort: true } })
await server.listen()
let browser
try {
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('http://localhost:5187')
  await page.locator('.camp-view').waitFor()
  // A reduced roster fixture keeps the recruitment branch exercised.
  await page.evaluate(async () => {
    const { Warrior } = await import('/src/core/heroes/Warrior.ts')
    window.__gameStore.startGame([Warrior.createStarter()])
  })
  await page.getByRole('button', { name: /Iniciar intento 1/ }).click()
  await page.locator('.expedition-map').waitFor()

  for (let combat = 0; combat < 4; combat++) {
    await page.evaluate(() => {
      const expedition = window.__expeditionStore
      const node = expedition.currentExpedition.nodes.find(n => expedition.availableNodes.includes(n.id))
      for (const enemy of node.enemies) { enemy.health = 1; enemy.baseStats.agility.value = 1 }
    })
    await page.locator('.map-node.available').first().click()
    await page.getByRole('dialog', { name: 'Vista previa de combate' }).waitFor()
    assert.equal(await page.evaluate(() => window.__gameStore.currentLocation), 'expedition-map')
    if (combat === 0) {
      const before = await page.evaluate(() => [...window.__expeditionStore.availableNodes])
      await page.keyboard.press('Escape')
      await page.locator('.combat-preview').waitFor({ state: 'hidden' })
      assert.deepEqual(await page.evaluate(() => [...window.__expeditionStore.availableNodes]), before)
      await page.locator('.map-node.available').first().click()
    }
    await page.getByRole('button', { name: 'Entrar en combate', exact: true }).click()
    await page.locator('.enemy-card').first().waitFor()
    await page.waitForTimeout(1200)
    await page.keyboard.press('r')
    await page.locator('.expedition-map').waitFor({ timeout: 20000 })
  }
  await page.locator('.map-node.available').first().click()
  await page.locator('.recruit-card').filter({ hasText: 'Elara' }).getByRole('button', { name: 'Unirse' }).click()
  await page.locator('.recruit-modal').waitFor({ state: 'hidden' })
  assert.equal(await page.evaluate(() => window.__gameStore.activeHeroes.length), 2)
  await page.locator('.map-node.available').first().click()
  await page.locator('.shop-view').waitFor()
  await page.locator('article').filter({ hasText: 'Estandarte de vigor' }).getByRole('button').click()
  await page.evaluate(() => { window.__gameStore.gold += 40 })
  await page.locator('article').filter({ hasText: 'Poción de curación' }).getByRole('button').click()
  assert.equal(await page.evaluate(() => window.__gameStore.equipment.includes('vigor-banner')), true)
  assert.equal(await page.evaluate(() => window.__gameStore.teamItems.includes('healing-potion')), true)

  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
  await page.getByRole('button', { name: 'Continuar la expedición' }).click()
  await page.evaluate(async () => {
    const { MountainEnemy } = await import('/src/core/enemies/MountainEnemy.ts')
    const expedition = window.__expeditionStore
    const node = expedition.currentExpedition.nodes.find(n => expedition.availableNodes.includes(n.id))
    node.type = 'combat'
    const enemy = new MountainEnemy('scout')
    enemy.baseStats.agility.value = 1000
    enemy.attackPatterns = [{ name: 'Derrota de prueba', type: 'testDefeat', cooldown: 0,
      targetType: 'enemies-only', execute: async () => {
        for (const hero of window.__gameStore.activeHeroes) hero.takeDamage(99999)
      } }]
    // Replacing the roster must not retain MountainEnemy's random opening index.
    enemy.selectAttackPattern = () => enemy.attackPatterns[0]
    node.enemies = [enemy]
  })
  await page.locator('.map-node.available').first().click()
  await page.getByRole('button', { name: 'Entrar en combate', exact: true }).click()
  await page.locator('.camp-view').waitFor({ timeout: 20000 })
  const before = await page.evaluate(() => ({
    classes: window.__gameStore.activeHeroes.map(h => h.heroClassId),
    gold: window.__gameStore.gold, equipment: [...window.__gameStore.equipment],
    items: [...window.__gameStore.teamItems], levels: window.__gameStore.activeHeroes.map(h => h.level)
  }))
  await page.reload()
  await page.locator('.camp-view').waitFor()
  const after = await page.evaluate(() => ({
    classes: window.__gameStore.activeHeroes.map(h => h.heroClassId),
    gold: window.__gameStore.gold, equipment: [...window.__gameStore.equipment],
    items: [...window.__gameStore.teamItems], levels: window.__gameStore.activeHeroes.map(h => h.level)
  }))
  assert.deepEqual(after, before)
  await page.getByRole('button', { name: /Iniciar intento 2/ }).click()
  await page.locator('.expedition-map').waitFor()
  assert.equal(await page.evaluate(() => window.__gameStore.activeHeroes.every(h => h.isAlive && h.health === h.maxHealth)), true)
  assert.deepEqual(errors, [])
  console.log('OK: cuatro victorias con vista previa y confirmación, recluta permanente, tienda, equipo, consumible, móvil, derrota, recarga y segundo intento sin errores de navegador.')
} finally {
  await browser?.close()
  await server.close()
}
