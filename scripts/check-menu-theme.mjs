import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const server = await createServer({ server: { port: 5191, strictPort: true } })
await server.listen()
let browser
try {
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('http://localhost:5191')
  await page.locator('.camp-view').waitFor()
  await page.evaluate(() => {
    const game = window.__gameStore
    game.setPartyHeroes(['warrior', 'cleric', 'rogue'])
    game.gold = 300
  })
  const checkViewport = async () => {
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  }
  const capture = async name => {
    if (process.env.CAMPAIGN_SCREENSHOTS) await page.screenshot({ path: `${process.env.CAMPAIGN_SCREENSHOTS}/${name}.png`, fullPage: true })
  }
  for (const width of [1366, 768, 360]) {
    await page.setViewportSize({ width, height: 900 })
    await checkViewport()
    const panel = await page.locator('.party-selection').evaluate(el => ({ background: getComputedStyle(el).backgroundColor, radius: getComputedStyle(el).borderRadius }))
    assert.equal(panel.background, 'rgb(48, 32, 24)')
    assert.equal(panel.radius, '2px')
    assert.equal(await page.locator('.camp-commands').count(), 0)
    assert.equal(await page.locator('.camp-hero-chips .stat-chip').count(), 27)
    await capture(`jrpg-camp-${width}`)
  }
  await page.locator('.gear-btn').click()
  assert.equal(await page.locator('.gear-btn').getAttribute('aria-expanded'), 'true')
  await page.keyboard.press('Escape')
  await page.locator('.settings-menu').waitFor({ state: 'hidden' })
  await page.evaluate(() => window.__gameStore.openShop('theme-check'))
  await page.locator('.shop-view').waitFor()
  for (const width of [1366, 360]) {
    await page.setViewportSize({ width, height: 900 })
    await checkViewport()
    assert.equal(await page.locator('.shop-grid').first().evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), 1)
    await capture(`jrpg-shop-${width}`)
  }
  await page.getByRole('button', { name: 'Comprar Poción de curación por 18 oro' }).click()
  assert.equal(await page.evaluate(() => window.__gameStore.gold), 282)

  // Respect OS preferences by default, but let the player explicitly opt into GIFs.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'Animar vendedor', exact: true }).waitFor()
  assert.match(await page.locator('.npc-portrait img').evaluate(img => img.currentSrc), /forest-merchant\.png/)
  await page.getByRole('button', { name: 'Animar vendedor', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('.npc-portrait img')?.currentSrc.includes('forest-merchant.gif'))
  assert.equal(await page.getByRole('button', { name: 'Pausar animación' }).getAttribute('aria-pressed'), 'true')
  assert.equal(await page.evaluate(() => localStorage.getItem('rpg-js-merchant-animation')), 'play')
  await page.getByRole('button', { name: 'Pausar animación' }).click()
  await page.waitForFunction(() => document.querySelector('.npc-portrait img')?.currentSrc.includes('forest-merchant.png'))
  await page.emulateMedia({ reducedMotion: 'no-preference' })

  await page.evaluate(async () => {
    const { MountainEnemy } = await import('/src/core/enemies/MountainEnemy.ts')
    window.__gameStore.finishRun(false)
    window.__gameStore.beginRun()
    const start = window.__expeditionStore.currentExpedition.nodes.find(node => node.id === 'start')
    start.enemies = ['scout', 'archer', 'guardian', 'shaman', 'bomber', 'bear', 'warlock', 'orc'].map(role => new MountainEnemy(role, 2))
  })
  await page.locator('.map-node.available').first().click()
  await page.locator('.combat-preview').waitFor()
  for (const width of [1366, 360]) {
    await page.setViewportSize({ width, height: 640 })
    await checkViewport()
    const metrics = await page.locator('.combat-preview').evaluate(dialog => {
      const content = dialog.querySelector('.preview-content')
      const actions = dialog.querySelector('.preview-actions').getBoundingClientRect()
      const xp = getComputedStyle(dialog.querySelector('.preview-xp'))
      const gold = getComputedStyle(dialog.querySelector('.preview-gold .gold-amount > span'))
      return { scrolls: content.scrollHeight > content.clientHeight, footerVisible: actions.top >= 0 && actions.bottom <= innerHeight, xpSize: xp.fontSize, goldSize: gold.fontSize }
    })
    assert.equal(metrics.scrolls, true)
    assert.equal(metrics.footerVisible, true)
    assert.equal(metrics.xpSize, metrics.goldSize)
    await capture(`jrpg-preview-${width}`)
  }
  await page.keyboard.press('Escape')
  await page.locator('.combat-preview').waitFor({ state: 'hidden' })
  assert.deepEqual(errors, [])
  console.log('OK: tema ámbar, campamento sin comandos, teclado, listas de tienda, compras y reflujo a 360 / 768 / 1366 px.')
} finally {
  await browser?.close()
  await server.close()
}
