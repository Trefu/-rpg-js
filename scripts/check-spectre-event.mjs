import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const server = await createServer({ server: { port: 5193, strictPort: true } })
await server.listen()
let browser
try {
  browser = await chromium.launch({ headless: true })
  for (const index of [0, 1, 2]) {
    const page = await browser.newPage({ viewport: { width: index === 1 ? 360 : 1366, height: 900 }, reducedMotion: index === 1 ? 'reduce' : 'no-preference' })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('http://localhost:5193')
    await page.locator('.camp-view').waitFor()
    await page.evaluate(async () => {
      const { MOUNTAIN_PEAK } = await import('/src/core/expeditions/mountainPeak.ts')
      MOUNTAIN_PEAK.generator.haunting.chance = 1
      // Headless browsers never unlock Web Audio; spy on the instance instead.
      const { AudioManager } = await import('/src/core/AudioManager.ts')
      const manager = AudioManager.getInstance()
      window.__spectreMusicCalls = 0
      manager.playSpectreCombat = () => { window.__spectreMusicCalls++ }
      window.__gameStore.beginRun()
    })
    await page.getByRole('dialog', { name: 'Algo acecha en la montaña.' }).waitFor()
    assert.equal(await page.locator('.app').evaluate(el => el.inert), true)
    if (index === 1) assert.equal(await page.locator('.mountain-omen').evaluate(el => getComputedStyle(el).animationName), 'none')
    if (process.env.CAMPAIGN_SCREENSHOTS) {
      await page.waitForTimeout(650)
      await page.screenshot({ path: `${process.env.CAMPAIGN_SCREENSHOTS}/spectre-omen-${index}.png` })
    }
    await page.locator('.mountain-omen').waitFor({ state: 'hidden', timeout: 7000 })
    assert.equal(await page.locator('.app').evaluate(el => el.inert), false)
    const eventNode = await page.evaluate(() => {
      const expedition = window.__expeditionStore.currentExpedition
      const node = expedition.nodes.find(node => node.curiosityEventId === 'spectral-pass')
      // Skip the first two fights in this UI fixture; map reachability is tested separately.
      for (const earlier of expedition.nodes.filter(other => other.depth < node.depth)) earlier.completed = true
      const parent = expedition.nodes.find(other => other.connections.includes(node.id))
      window.__expeditionStore.selectNode(parent)
      return { id: node.id, depth: node.depth }
    })
    assert.equal(eventNode.depth, 3)
    await page.getByRole('button', { name: 'Explorar encuentro · Paso 3', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Algo se acerca' })
    await dialog.waitFor()
    assert.equal(await dialog.getByRole('button', { name: 'CORRER', exact: true }).count(), 3)
    assert.equal(await dialog.getByRole('button', { name: 'Cerrar evento' }).count(), 0)
    await page.keyboard.press('Escape')
    assert.equal(await dialog.isVisible(), true)
    await page.locator('.curiosity-overlay').click({ position: { x: 2, y: 2 } })
    assert.equal(await dialog.isVisible(), true)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    if (process.env.CAMPAIGN_SCREENSHOTS) await page.screenshot({ path: `${process.env.CAMPAIGN_SCREENSHOTS}/spectre-event-${index}.png` })
    await dialog.getByRole('button', { name: 'CORRER', exact: true }).nth(index).click()
    await page.locator('.enemy-card').waitFor()
    assert.equal(await page.evaluate(() => window.__spectreMusicCalls), 1)
    if (index === 0) {
      const asset = await page.request.get('http://localhost:5193/assets/music/spectre-ost.mp3')
      assert.equal(asset.status(), 200)
    }
    assert.equal(await page.evaluate(() => window.__gameStore.currentLocation), 'combat')
    assert.deepEqual(await page.evaluate(() => window.__expeditionStore.selectedNode.enemies.map(enemy => enemy.name)), ['Espectro del paso'])
    assert.equal(await dialog.count(), 0)
    assert.deepEqual(errors, [])
    await page.close()
  }
  // A map without the spectral roll must not show the omen or reserve the event.
  const page = await browser.newPage()
  await page.goto('http://localhost:5193')
  await page.locator('.camp-view').waitFor()
  await page.evaluate(async () => {
    const { MOUNTAIN_PEAK } = await import('/src/core/expeditions/mountainPeak.ts')
    MOUNTAIN_PEAK.generator.haunting.chance = 0
    window.__gameStore.beginRun()
  })
  await page.locator('.expedition-map').waitFor()
  assert.equal(await page.locator('.mountain-omen').count(), 0)
  assert.equal(await page.evaluate(() => window.__expeditionStore.currentExpedition.nodes.some(node => node.curiosityEventId === 'spectral-pass')), false)
  console.log('OK: presagio de 3,5s, movimiento reducido, evento obligatorio en tercera fila, los tres CORRER conducen al Espectro y su OST suena en su combate.')
} finally {
  await browser?.close()
  await server.close()
}
