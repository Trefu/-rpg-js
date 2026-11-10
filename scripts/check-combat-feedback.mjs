import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const server = await createServer({ server: { port: 5193, strictPort: true } })
await server.listen()
let browser
try {
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('http://localhost:5193')
  await page.locator('.camp-view').waitFor()
  await page.evaluate(async () => {
    const { MountainEnemy } = await import('/src/core/enemies/mountainPeak/MountainEnemy.ts')
    const { StatusEffects } = await import('/src/core/StatusEffects.ts')
    const game = window.__gameStore
    game.setPartyHeroes(['warrior', 'cleric', 'rogue'])
    game.beginRun()
    for (const hero of game.activeHeroes) hero.baseStats.agility.value = 1000
    const node = window.__expeditionStore.currentExpedition.nodes.find(node => node.id === 'start')
    node.enemies = [new MountainEnemy('orc', 3), new MountainEnemy('orc', 3)]
    for (const enemy of node.enemies) enemy.addStatusEffect({ ...StatusEffects.BLEED, stacks: 1 })
    game.navigateTo('combat')
  })
  await page.locator('.enemy-card').nth(1).waitFor()
  await page.evaluate(async () => {
    const { StatusEffects } = await import('/src/core/StatusEffects.ts')
    const hero = window.__gameStore.activeHeroes[0]
    for (const effect of [StatusEffects.POISON, StatusEffects.BLEED, StatusEffects.SECOND_WIND]) {
      hero.addStatusEffect({ ...effect, ...(effect.type === 'second_wind' ? {} : { stacks: 1 }) })
    }
    hero.addStatusEffect({ ...StatusEffects.INJURED, descriptionOnPlayer: 'Descripción de aliado', descriptionOnEnemy: 'Descripción de enemigo' })
  })
  const heroIcons = page.locator('.hero-card').first().locator('.enemy-status-icon')
  assert.equal(await heroIcons.count(), 4)
  assert.equal(await heroIcons.filter({ has: page.locator('.enemy-status-stacks') }).count(), 2)
  assert.equal(await page.locator('.hero-card').first().locator('.status-charges').count(), 1)
  assert.equal(await page.locator('.hero-card').first().locator('.enemy-status-turns').count(), 3)
  assert.equal(await page.locator('.enemy-card').first().locator('.enemy-status-stacks').innerText(), '×1')
  const names = await page.locator('.enemy-name-top').allTextContents()
  assert.notEqual(names[0], names[1])
  const badgeColor = async locator => locator.evaluate(el => ({ color: getComputedStyle(el).color, background: getComputedStyle(el).backgroundImage }))
  assert.deepEqual(await badgeColor(page.locator('.hero-card .enemy-status-stacks').first()), await badgeColor(page.locator('.enemy-card .enemy-status-stacks').first()))
  for (const icon of await heroIcons.all()) {
    const bounds = await icon.boundingBox()
    assert.ok(bounds.width >= 44 && bounds.height >= 44, 'Status controls must be at least 44px')
  }
  await heroIcons.last().focus()
  await page.keyboard.press('Enter')
  await page.getByRole('dialog', { name: /Info de/ }).waitFor({ timeout: 5000 }).catch(async error => {
    throw new Error(`${error.message}\n${JSON.stringify(errors)}\n${await page.evaluate(() => document.activeElement?.outerHTML)}\n${await page.locator('.esi-info-popup').count()}`)
  })
  assert.match(await page.locator('.esi-info-popup').innerText(), /Descripción de aliado/)
  assert.doesNotMatch(await page.locator('.esi-info-popup').innerText(), /Sin descripción disponible/)
  await page.keyboard.press('Escape')
  await page.locator('.esi-info-popup').waitFor({ state: 'detached' })
  assert.equal(await page.locator('.esi-info-popup').count(), 0)
  assert.equal(await heroIcons.last().evaluate(el => el === document.activeElement), true)
  if (process.env.CAMPAIGN_SCREENSHOTS) {
    await mkdir(process.env.CAMPAIGN_SCREENSHOTS, { recursive: true })
    await page.screenshot({ path: `${process.env.CAMPAIGN_SCREENSHOTS}/combat-feedback-desktop.png` })
  }
  await page.setViewportSize({ width: 360, height: 800 })
  await page.locator('.mobile-hud .combat-status-strip').waitFor()
  assert.equal(await page.locator('.mobile-hud .combat-status-strip .enemy-status-stacks').count(), 2)
  await page.locator('.mobile-hud .combat-status-strip .enemy-status-icon').last().click()
  await page.locator('.esi-info-popup').waitFor()
  assert.match(await page.locator('.esi-info-popup').innerText(), /Descripción de aliado/)
  assert.equal(await page.locator('.esi-info-popup').evaluate(el => {
    const bounds = el.getBoundingClientRect()
    return bounds.left >= 0 && bounds.right <= innerWidth + 1 && bounds.top >= 0 && bounds.bottom <= innerHeight + 1
  }), true, 'Tooltip must fit mobile viewport')
  await page.keyboard.press('Escape')
  await page.locator('.esi-info-popup').waitFor({ state: 'detached' })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  if (process.env.CAMPAIGN_SCREENSHOTS) await page.screenshot({ path: `${process.env.CAMPAIGN_SCREENSHOTS}/combat-feedback-mobile.png` })
  await page.evaluate(() => {
    const hero = window.__gameStore.activeHeroes[0]
    hero.statusEffects.find(effect => effect.type === 'poison').stacks = 3
  })
  await page.locator('.combat-status-notice').filter({ hasText: /×1 → ×3/ }).waitFor({ state: 'attached' })
  await page.evaluate(() => {
    const hero = window.__gameStore.activeHeroes[0]
    hero.statusEffects = hero.statusEffects.filter(effect => effect.type !== 'poison')
  })
  await page.locator('.log-fab').click()
  await page.getByRole('button', { name: 'Ver completo' }).click()
  await page.locator('.combat-log-modal').waitFor()
  await page.getByRole('button', { name: 'Estados', exact: true }).click()
  assert.match(await page.locator('.combat-log-modal .log-list').innerText(), /Envenenado ×1 → ×3/)
  assert.match(await page.locator('.combat-log-modal .log-list').innerText(), /Envenenado termina/)
  assert.equal(await page.locator('.combat-log-modal .combat-log-turn').count(), 0)
  await page.getByRole('button', { name: 'Todos', exact: true }).click()
  assert.ok(await page.locator('.combat-log-modal .combat-log-turn').count() > 0)
  if (process.env.CAMPAIGN_SCREENSHOTS) await page.screenshot({ path: `${process.env.CAMPAIGN_SCREENSHOTS}/combat-feedback-log-mobile.png` })
  await page.keyboard.press('Escape')
  await page.locator('.combat-log-modal').waitFor({ state: 'detached' })
  // Applying a status must not add an automatic visual banner or move either HUD.
  for (const width of [1366, 360]) {
    await page.setViewportSize({ width, height: 800 })
    const heroSelector = width > 720 ? '.hero-card' : '.mobile-hud-hero'
    await page.locator(heroSelector).first().waitFor()
    const before = await page.evaluate(selector => {
      const hero = document.querySelector(selector).getBoundingClientRect()
      const enemyHp = document.querySelector('.enemy-health').getBoundingClientRect()
      return { heroHeight: hero.height, enemyTop: enemyHp.top }
    }, heroSelector)
    await page.evaluate(async () => {
      const { StatusEffects } = await import('/src/core/StatusEffects.ts')
      const hero = window.__gameStore.activeHeroes[0]
      hero.addStatusEffect({ ...StatusEffects.POISON, stacks: 1 })
      const enemy = window.__expeditionStore.currentExpedition.currentNode.enemies[0]
      enemy.addStatusEffect({ ...StatusEffects.POISON, stacks: 1 })
    })
    await page.locator(`${heroSelector} .enemy-status-icon`).filter({ hasText: '×1' }).first().waitFor()
    const after = await page.evaluate(selector => {
      const hero = document.querySelector(selector).getBoundingClientRect()
      const enemyHp = document.querySelector('.enemy-health').getBoundingClientRect()
      const notices = [...document.querySelectorAll('.combat-status-notice')]
      return { heroHeight: hero.height, enemyTop: enemyHp.top, hidden: notices.every(el => {
        const bounds = el.getBoundingClientRect()
        return bounds.width <= 1 && bounds.height <= 1
      }) }
    }, heroSelector)
    assert.equal(after.heroHeight, before.heroHeight, `${width}: status notice moved the hero HUD`)
    assert.equal(after.enemyTop, before.enemyTop, `${width}: status notice moved enemy HP`)
    assert.equal(after.hidden, true)
  }
  assert.deepEqual(errors, [])
  console.log('OK: estados compartidos, ×1, cargas, descripciones por bando, colores, teclado, foco, controles táctiles y reflujo móvil.')
} finally {
  await browser?.close()
  await server.close()
}
