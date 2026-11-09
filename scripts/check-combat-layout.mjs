import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const server = await createServer({ server: { port: 5192, strictPort: true } })
await server.listen()
let browser
try {
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1577, height: 773 }, reducedMotion: 'reduce' })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('http://localhost:5192')
  await page.locator('.camp-view').waitFor()
  await page.evaluate(async () => {
    const { MountainEnemy } = await import('/src/core/enemies/mountainPeak/MountainEnemy.ts')
    const { StatusEffects } = await import('/src/core/StatusEffects.ts')
    const game = window.__gameStore
    game.setPartyHeroes(['warrior', 'cleric', 'rogue'])
    game.beginRun()
    for (const hero of game.activeHeroes) hero.baseStats.agility.value = 1000
    const node = window.__expeditionStore.currentExpedition.nodes.find(node => node.id === 'start')
    node.enemies = ['orc', 'orcArcher', 'orcGuard', 'shaman', 'orc', 'orcKing'].map(role => {
      const enemy = new MountainEnemy(role, 3)
      enemy.addStatusEffect({ ...StatusEffects.POISON, stacks: 3 })
      return enemy
    })
    game.navigateTo('combat')
  })
  await page.locator('.enemy-card').nth(5).waitFor()

  for (const [width, height] of [[1577, 773], [1366, 768], [1024, 600], [820, 650], [390, 844], [360, 640]]) {
    await page.setViewportSize({ width, height })
    await page.waitForFunction(() => document.querySelector('.enemies-container')?.style.getPropertyValue('--enemy-columns') === (innerWidth <= 900 ? '2' : '3'))
    const cells = await page.locator('.enemy-card').evaluateAll(cards => cards.map(card => {
      const rect = card.getBoundingClientRect()
      const hp = card.querySelector('.enemy-health').getBoundingClientRect()
      return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, hpTop: hp.top, hpBottom: hp.bottom }
    }))
    for (const cell of cells) {
      assert.ok(cell.hpTop >= cell.top && cell.hpBottom <= cell.bottom + 1, `${width}: HP outside enemy card`)
    }
    for (let a = 0; a < cells.length; a++) for (let b = a + 1; b < cells.length; b++) {
      const first = cells[a], next = cells[b]
      assert.ok(first.right <= next.left + 1 || next.right <= first.left + 1 || first.bottom <= next.top + 1 || next.bottom <= first.top + 1, `${width}: overlapping enemies`)
    }
    for (const bar of await page.locator('.enemy-health').all()) {
      await bar.scrollIntoViewIfNeeded()
      assert.equal(await bar.evaluate(el => {
        const hp = el.getBoundingClientRect()
        const field = el.closest('.enemies-column').getBoundingClientRect()
        const hit = document.elementFromPoint(hp.left + hp.width / 2, hp.top + hp.height / 2)
        return hp.top >= field.top - 1 && hp.bottom <= field.bottom + 1 && !!hit?.closest('.enemy-card')
      }), true, `${width}: HP clipped or covered by action bar`)
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.locator('.enemies-column').evaluate(el => { el.scrollTop = 0 })
    if (process.env.CAMPAIGN_SCREENSHOTS) await page.screenshot({ path: `${process.env.CAMPAIGN_SCREENSHOTS}/combat-layout-${width}.png` })
  }
  // A status icon must stay below the ability panel even with a very high local z-index.
  await page.setViewportSize({ width: 1366, height: 768 })
  await page.locator('.desktop-actions .aab-btn').first().click()
  await page.locator('.aab-info-card').waitFor()
  const overlayCheck = await page.locator('.aab-info-card').evaluate(panel => {
    const bounds = panel.getBoundingClientRect()
    const x = bounds.left + bounds.width / 2
    const y = bounds.top + bounds.height / 2
    const icons = document.querySelector('.enemy-status-icons')
    const originalStyle = icons.getAttribute('style')
    icons.style.cssText = `position:fixed;left:${x - 10}px;top:${y - 10}px;z-index:99999;visibility:visible;`
    const coveredByPanel = !!document.elementFromPoint(x, y)?.closest('.aab-info-card')
    if (originalStyle === null) icons.removeAttribute('style')
    else icons.setAttribute('style', originalStyle)
    return coveredByPanel
  })
  assert.equal(overlayCheck, true, 'Status effects must never cover the ability panel')
  await page.locator('.aab-info-close').click()
  assert.deepEqual(errors, [])
  console.log('OK: seis enemigos sin solapamientos, vida dentro de cada ficha y accesible sobre las acciones, escritorio/tablet/móvil.')
} finally {
  await browser?.close()
  await server.close()
}
