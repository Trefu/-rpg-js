import physical from '@/assets/ui/display/damage-physical.png'
import poison from '@/assets/ui/display/damage-poison.png'
import radiant from '@/assets/ui/display/damage-radiant.png'
import necrotic from '@/assets/ui/display/damage-necrotic.png'
import cold from '@/assets/ui/display/damage-cold.png'
import fire from '@/assets/ui/display/damage-fire.png'

/** Visual subtypes only: never changes resistance, scaling or damage rules. */
export function damageTypePresentation(type?: string, attackName = '') {
  switch (type) {
    case 'physical': return { icon: physical, label: 'Físico' }
    case 'poison': return { icon: poison, label: 'Veneno' }
    case 'holy':
    case 'radiant': return { icon: radiant, label: 'Radiante' }
    case 'fire': return { icon: fire, label: 'Fuego' }
    case 'frost':
    case 'cold': return { icon: cold, label: 'Frío' }
    case 'shadow':
    case 'necrotic': return { icon: necrotic, label: 'Necrótico' }
    case 'water':
      if (/glacial|hielo|fr[ií]o|escarcha|helad|congela/i.test(attackName)) return { icon: cold, label: 'Frío' }
      break
    case 'arcane':
      if (/necr[oó]tic|sombr|maldici[oó]n|drenaje|muerte|espectral|alma/i.test(attackName)) return { icon: necrotic, label: 'Necrótico' }
      break
  }
  return undefined
}
