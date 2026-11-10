import { describe, expect, it } from 'vitest'
import { damageTypePresentation } from './damageTypePresentation'

describe('Iconos semánticos de daño', () => {
  it.each([
    ['physical', '', 'Físico'], ['poison', '', 'Veneno'],
    ['holy', '', 'Radiante'], ['fire', '', 'Fuego'],
    ['frost', '', 'Frío'], ['shadow', '', 'Necrótico'],
    ['water', 'Aliento Glacial', 'Frío'],
    ['arcane', 'Maldición del paso', 'Necrótico']
  ])('%s / %s muestra %s', (type, name, label) => {
    expect(damageTypePresentation(type, name)).toMatchObject({ label, icon: expect.any(String) })
  })

  it('no confunde agua con hielo ni arcano genérico con necrótico', () => {
    expect(damageTypePresentation('water', 'Chorro de agua')).toBeUndefined()
    expect(damageTypePresentation('arcane', 'Proyectil arcano')).toBeUndefined()
    expect(damageTypePresentation(undefined)).toBeUndefined()
  })
})
