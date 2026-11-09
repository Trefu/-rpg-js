import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { MountainEnemy, MOUNTAIN_ROLES } from './MountainEnemy'
import { Spectre } from './uniqueEncounters/Spectre'
import { MOUNTAIN_PEAK } from '../../expeditions/mountainPeak'
import { resolveEncounterById } from '../../expeditions/encounters'

describe('Avatares de Montañas Rocosas', () => {
  const sprites = [...new Set([...MOUNTAIN_ROLES.map(role => new MountainEnemy(role).sprite), new Spectre().sprite])]

  it('cada avatar de combate tiene enemigo y encuentro asignado a Montañas Rocosas', () => {
    const avatars = readdirSync(fileURLToPath(new URL('../../../assets/sprites/enemies/', import.meta.url)))
      .filter(file => file.endsWith('.png') && file !== 'dummy.png').sort()
    const assigned = new Set(Object.keys(MOUNTAIN_PEAK.encounters).flatMap(id =>
      resolveEncounterById(MOUNTAIN_PEAK, id).map(enemy => enemy.sprite!.split('/').pop())))
    expect([...assigned].sort()).toEqual(avatars)
  })

  it.each(sprites)('%s usa el lienzo común de 600 × 600', sprite => {
    const path = fileURLToPath(new URL(`../../../..${sprite}`, import.meta.url))
    const png = readFileSync(path)
    expect(png.subarray(1, 4).toString()).toBe('PNG')
    expect(png.readUInt32BE(16)).toBe(600)
    expect(png.readUInt32BE(20)).toBe(600)
  })
})
