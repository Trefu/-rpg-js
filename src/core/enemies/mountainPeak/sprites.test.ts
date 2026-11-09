import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { MountainEnemy, MOUNTAIN_ROLES } from './MountainEnemy'

describe('Avatares de Montañas Rocosas', () => {
  const sprites = [...new Set(MOUNTAIN_ROLES.map(role => new MountainEnemy(role).sprite))]

  it.each(sprites)('%s usa el lienzo común de 600 × 600', sprite => {
    const path = fileURLToPath(new URL(`../../../..${sprite}`, import.meta.url))
    const png = readFileSync(path)
    expect(png.subarray(1, 4).toString()).toBe('PNG')
    expect(png.readUInt32BE(16)).toBe(600)
    expect(png.readUInt32BE(20)).toBe(600)
  })
})
