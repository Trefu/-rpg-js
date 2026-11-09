import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const server = await createServer({ server: { port: 5193, strictPort: true } })
await server.listen()
let browser
try {
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 }, reducedMotion: 'reduce' })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('http://localhost:5193')
  await page.locator('.camp-view').waitFor()
  await page.evaluate(async () => {
    const { Cleric } = await import('/src/core/heroes/Cleric.ts')
    const { Warrior } = await import('/src/core/heroes/Warrior.ts')
    const { MountainEnemy } = await import('/src/core/enemies/mountainPeak/MountainEnemy.ts')
    const game = window.__gameStore
    game.startGame([Cleric.createStarter(), Warrior.createStarter()])
    game.beginRun()
    const [cleric, warrior] = game.activeHeroes
    cleric.baseStats.agility.value = 1000
    warrior.baseStats.agility.value = 800
    cleric.health = 30
    warrior.health = 100
    const node = window.__expeditionStore.currentExpedition.nodes.find(node => node.id === 'start')
    node.enemies = [new MountainEnemy('guardian', 3)]
    node.enemies[0].baseStats.agility.value = 1
    game.navigateTo('combat')
  })
  await page.getByRole('button', { name: 'Bendición Divina', exact: true }).click()
  await page.locator('.aab-info-card').waitFor()
  assert.match(await page.locator('.aab-info-damage').innerText(), /Vida temporal.*42 HP/is)
  assert.doesNotMatch(await page.locator('.aab-info-damage').innerText(), /Daño 42/)
  await page.locator('.aab-info-use').click()
  await page.locator('.hero-card.target-selectable').nth(1).click()
  await page.waitForFunction(() => window.__gameStore.activeHeroes[1].statusEffects.some(effect => effect.type === 'divine_protection'))
  assert.deepEqual(await page.evaluate(() => {
    const [cleric, warrior] = window.__gameStore.activeHeroes
    return { clericHp: cleric.health, energy: cleric.energy, allyHp: warrior.health,
      shield: warrior.statusEffects.find(effect => effect.type === 'divine_protection').absorbRemaining,
      damageBuff: warrior.statusEffects.some(effect => effect.type === 'divine_empowerment') }
  }), { clericHp: 72, energy: 40, allyHp: 100, shield: 42, damageBuff: true })
  const shield = page.locator('.hero-card').nth(1).locator('.shield-overlay')
  await shield.waitFor()
  assert.equal(await shield.getAttribute('aria-label'), 'Escudo: 42 de daño absorbible')
  const geometry = await shield.evaluate(el => {
    const bar = el.parentElement.getBoundingClientRect()
    const sub = el.getBoundingClientRect()
    const layer = el.querySelector('.shield-layer').getBoundingClientRect()
    return { contained: sub.top >= bar.top && sub.bottom <= bar.bottom + 1,
      barHeight: bar.height, height: sub.height, ratio: layer.width / sub.width,
      expected: 42 / window.__gameStore.activeHeroes[1].maxHealth }
  })
  assert.equal(geometry.contained, true, JSON.stringify(geometry))
  assert.ok(geometry.height >= geometry.barHeight - 2, JSON.stringify(geometry))
  assert.ok(Math.abs(geometry.ratio - geometry.expected) < 0.02, JSON.stringify(geometry))
  if (process.env.CAMPAIGN_SCREENSHOTS) await page.screenshot({ path: `${process.env.CAMPAIGN_SCREENSHOTS}/divine-blessing-desktop.png` })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.locator('.mobile-top-hud').waitFor()
  await page.locator('.mobile-top-hud .shield-overlay').first().waitFor()
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  if (process.env.CAMPAIGN_SCREENSHOTS) await page.screenshot({ path: `${process.env.CAMPAIGN_SCREENSHOTS}/divine-blessing-mobile.png` })
  for (const width of [1366, 360]) {
    await page.setViewportSize({ width, height: width === 360 ? 844 : 900 })
    for (const amount of [50, 200, 250]) {
      await page.evaluate(amount => {
        const hero = window.__gameStore.activeHeroes[1]
        hero.maxHealth = 100
        hero.health = 100
        hero.statusEffects.find(effect => effect.type === 'divine_protection').absorbRemaining = amount
      }, amount)
      const overlay = width === 360
        ? page.locator('.mobile-top-hud .shield-overlay').first()
        : page.locator('.hero-card').nth(1).locator('.shield-overlay')
      await overlay.waitFor()
      const percentages = await overlay.locator('.shield-layer').evaluateAll(layers => layers.map(layer => parseFloat(layer.style.width)))
      assert.deepEqual(percentages, amount === 50 ? [50] : amount === 200 ? [100, 100] : [100, 100, 50])
      assert.equal(await overlay.evaluate(el => {
        const track = el.parentElement.getBoundingClientRect()
        return [...el.children].every(layer => {
          const rect = layer.getBoundingClientRect()
          return rect.top >= track.top && rect.bottom <= track.bottom && rect.right <= track.right
        })
      }), true)
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
      if (process.env.CAMPAIGN_SCREENSHOTS) await page.screenshot({ path: `${process.env.CAMPAIGN_SCREENSHOTS}/shield-${amount}-${width}.png` })
    }
  }
  assert.deepEqual(errors, [])
  console.log('OK: Bendición Divina selecciona aliados, aplica escudo y +20% daño, cura a Elara y muestra subbarra azul en escritorio/móvil.')
} finally {
  await browser?.close()
  await server.close()
}
