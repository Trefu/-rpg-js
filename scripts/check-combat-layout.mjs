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
  await page.evaluate(() => document.fonts.ready)

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
    if (width <= 720) assert.equal(await page.locator('.combat-hotkey:visible').count(), 0, 'Desktop hotkeys must stay hidden on mobile')
    await page.locator('.enemies-column').evaluate(el => { el.scrollTop = 0 })
    if (process.env.CAMPAIGN_SCREENSHOTS) await page.screenshot({ path: `${process.env.CAMPAIGN_SCREENSHOTS}/combat-layout-${width}.png` })
  }
  // A status icon must stay below the ability panel even with a very high local z-index.
  await page.setViewportSize({ width: 1366, height: 768 })
  await page.locator('.desktop-actions .aab-btn').first().click()
  await page.locator('.aab-info-card').waitFor()
  await page.waitForFunction(() => {
    const panel = document.querySelector('.aab-info')
    return panel && getComputedStyle(panel).opacity === '1' && !panel.classList.contains('aab-info-enter-active')
  })
  await page.locator('.aab-info-card .damage-type-icon').waitFor()
  await page.waitForFunction(() => [...document.querySelectorAll('.aab-info-card .damage-type-icon')]
    .every(image => image.complete && image.naturalWidth === 64))
  if (process.env.CAMPAIGN_SCREENSHOTS) await page.screenshot({ path: `${process.env.CAMPAIGN_SCREENSHOTS}/combat-ability-damage-icons.png`, animations: 'disabled' })
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
  await page.locator('.aab-info-card').waitFor({ state: 'detached' })
  await page.locator('.desktop-actions .aab-btn').nth(1).click()
  await page.locator('.aab-info-card .aab-info-cost-icon').waitFor()
  await page.waitForFunction(() => !document.querySelector('.aab-info')?.classList.contains('aab-info-enter-active'))
  await page.waitForFunction(() => [...document.querySelectorAll('.aab-info-card .aab-info-cost-icon, .aab-info-card .aab-info-cd-icon')]
    .every(image => image.complete && image.naturalWidth === 64))
  if (process.env.CAMPAIGN_SCREENSHOTS) await page.screenshot({ path: `${process.env.CAMPAIGN_SCREENSHOTS}/combat-ability-cost-icons.png`, animations: 'disabled' })
  await page.locator('.aab-info-close').click()
  await page.locator('.aab-info-card').waitFor({ state: 'detached' })
  await page.locator('.desktop-actions .aab-btn').nth(2).click()
  await page.locator('.aab-info-card .aab-info-cd-icon').waitFor()
  await page.waitForFunction(() => !document.querySelector('.aab-info')?.classList.contains('aab-info-enter-active'))
  await page.waitForFunction(() => document.querySelector('.aab-info-card .aab-info-cd-icon')?.naturalWidth === 64)
  if (process.env.CAMPAIGN_SCREENSHOTS) await page.screenshot({ path: `${process.env.CAMPAIGN_SCREENSHOTS}/combat-ability-cooldown-icon.png`, animations: 'disabled' })
  await page.locator('.aab-info-close').click()
  await page.locator('.aab-info-card').waitFor({ state: 'detached' })
  // Generated keycaps must load, and retain the existing keyboard bindings.
  const abilityKeys = page.locator('.desktop-actions .combat-hotkey')
  assert.deepEqual(await abilityKeys.evaluateAll(keys => keys.map(key => key.getAttribute('aria-label'))),
    ['Tecla Q', 'Tecla W', 'Tecla E', 'Tecla R', 'Tecla T'])
  await page.waitForFunction(() => [...document.querySelectorAll('.desktop-actions .combat-hotkey img')]
    .every(image => image.complete && image.naturalWidth === 64))
  assert.equal(await abilityKeys.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth === 64)), true)
  await page.keyboard.press('q')
  await page.locator('.enemy-shortcut-badge').nth(5).waitFor()
  assert.deepEqual(await page.locator('.enemy-shortcut-badge .combat-hotkey').evaluateAll(keys => keys.map(key => key.getAttribute('aria-label'))),
    ['Tecla 1', 'Tecla 2', 'Tecla 3', 'Tecla 4', 'Tecla 5', 'Tecla 6'])
  await page.waitForFunction(() => [...document.querySelectorAll('.enemy-shortcut-badge img')]
    .every(image => image.complete && image.naturalWidth === 64))
  assert.equal(await page.locator('.enemy-shortcut-badge img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth === 64)), true)
  if (process.env.CAMPAIGN_SCREENSHOTS) await page.screenshot({ path: `${process.env.CAMPAIGN_SCREENSHOTS}/combat-hotkeys-targets.png` })
  const healthBefore = await page.evaluate(() => window.__expeditionStore.currentExpedition.currentNode.enemies[5].health)
  await page.keyboard.press('6')
  await page.waitForFunction(before => window.__expeditionStore.currentExpedition.currentNode.enemies[5].health < before, healthBefore)
  await page.getByRole('button', { name: 'Bendición Divina', exact: true }).waitFor()
  await page.waitForFunction(() => !document.querySelector('.desktop-actions .aab-btn')?.disabled)
  await page.getByRole('button', { name: 'Bendición Divina', exact: true }).click()
  await page.locator('.aab-info-use').click()
  await page.locator('.hero-shortcut-badge').nth(2).waitFor()
  assert.deepEqual(await page.locator('.hero-shortcut-badge .combat-hotkey').evaluateAll(keys => keys.map(key => key.getAttribute('aria-label'))),
    ['Tecla 1', 'Tecla 2', 'Tecla 3'])
  await page.keyboard.press('Escape')
  assert.deepEqual(errors, [])
  console.log('OK: seis enemigos sin solapamientos, vida accesible, iconos Q/W/E/R/T y 1–6 cargados, atajos de enemigos y aliados, escritorio/tablet/móvil.')
} finally {
  await browser?.close()
  await server.close()
}
