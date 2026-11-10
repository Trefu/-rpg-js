import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const server = await createServer({ server: { port: 5194, strictPort: true } })
await server.listen()
let browser
try {
  browser = await chromium.launch({ headless: true })
  for (const viewport of [{ width: 1366, height: 768 }, { width: 390, height: 844 }]) {
  const page = await browser.newPage({ viewport })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('http://localhost:5194')
  await page.locator('.camp-view').waitFor()
  await page.evaluate(async () => {
    const { MountainEnemy } = await import('/src/core/enemies/mountainPeak/MountainEnemy.ts')
    const { Warrior } = await import('/src/core/heroes/Warrior.ts')
    const game = window.__gameStore
    game.startGame([Warrior.createStarter()])
    game.beginRun()
    game.activeHeroes[0].baseStats.agility.value = 1000
    const node = window.__expeditionStore.currentExpedition.nodes.find(node => node.id === 'start')
    node.enemies = [new MountainEnemy('guardian', 9), new MountainEnemy('guardian', 9)]
    node.enemies.forEach(enemy => { enemy.baseStats.agility.value = 1 })
    game.navigateTo('combat')
  })
  await page.getByRole('button', { name: 'Golpe Devastador', exact: true }).click()
  await page.locator('.aab-info-use').waitFor()
  const baseline = await page.evaluate(() => {
    const field = document.querySelector('.enemies-column')
    return { height: field.clientHeight, scrollHeight: field.scrollHeight }
  })
  assert.ok(baseline.scrollHeight <= baseline.height + 1, 'Fixture must not need vertical scrolling')
  // A diagonal slash has the largest transformed bounds. Keep the real cast flow.
  await page.evaluate(() => { Math.random = () => 0.75 })
  const sample = page.evaluate(() => new Promise(resolve => {
    const frames = []
    const started = performance.now()
    const collect = () => {
      const field = document.querySelector('.enemies-column')
      frames.push({ height: field.clientHeight, scrollHeight: field.scrollHeight,
        vfx: document.querySelectorAll('.enemy-vfx-effect').length,
        popups: document.querySelectorAll('.enemy-hit-popup').length })
      if (performance.now() - started < 2200) requestAnimationFrame(collect)
      else resolve(frames)
    }
    requestAnimationFrame(collect)
  }))
  await page.locator('.aab-info-use').click()
  const frames = await sample
  assert.ok(frames.some(frame => frame.vfx === 2 && frame.popups === 2), 'Must exercise simultaneous AoE feedback')
  assert.ok(frames.every(frame => frame.scrollHeight <= frame.height + 1), `AoE introduced vertical overflow: ${JSON.stringify(frames.filter(frame => frame.scrollHeight > frame.height + 1).slice(0, 3))}`)
  assert.deepEqual(errors, [])
  await page.close()
  }
  console.log('OK: Golpe Devastador no genera scroll vertical durante los VFX diagonales ni los números de daño, en escritorio y móvil.')
} finally {
  await browser?.close()
  await server.close()
}
