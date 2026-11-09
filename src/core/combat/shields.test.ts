import { describe, expect, it } from 'vitest'
import { getShieldLayers } from './shields'

describe('Capas de vida temporal sobre la barra de HP', () => {
  it('50 de escudo sobre 100 HP ocupa exactamente la mitad', () => {
    expect(getShieldLayers(50, 100)).toEqual([{ percent: 50, units: 1 }])
  })
  it('200 sobre 100 HP se representa con dos capas completas', () => {
    expect(getShieldLayers(200, 100)).toEqual([{ percent: 100, units: 1 }, { percent: 100, units: 1 }])
  })
  it('la última capa conserva la proporción del sobrante', () => {
    expect(getShieldLayers(250, 100).map(layer => layer.percent)).toEqual([100, 100, 50])
    expect(getShieldLayers(138, 351)[0].percent).toBeCloseTo(39.316)
  })
  it('agrupa escudos extremos sin añadir filas fuera de la barra', () => {
    expect(getShieldLayers(1000, 100)).toHaveLength(4)
    expect(getShieldLayers(1000, 100)[3]).toEqual({ percent: 100, units: 7 })
  })
  it('no muestra capas sin escudo o sin vida máxima', () => {
    expect(getShieldLayers(0, 100)).toEqual([])
    expect(getShieldLayers(50, 0)).toEqual([])
  })
})
