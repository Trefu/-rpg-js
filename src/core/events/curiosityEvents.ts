import type { Hero } from '../Hero'

// ============================================================================
// Tipos del sistema de eventos "??" (estilo Slay the Spire).
//
// Un evento tiene un titulo, una descripcion narrativa y 2-3 elecciones.
// Cada eleccion produce un outcome que el motor sabe aplicar al estado del
// juego (recompensa, castigo, emboscada o no-op).
//
// `reward` y `punishment` aceptan el mismo set de `Effect` para permitir
// tradeoffs (ej. "te haces dano pero ganas un flask"). La diferencia entre
// ambos esta solo en el texto de flavor.
// ============================================================================

/** Set unificado de efectos aplicables al party. */
export type Effect =
  | { kind: 'gold'; amount: number }
  | { kind: 'xp'; amount: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'fullHeal' }
  | { kind: 'restoreEnergy'; amount: number }
  | { kind: 'energyLoss'; amount: number }
  | { kind: 'damage'; amount: number }
  | { kind: 'grantItem'; itemId: string }
  | { kind: 'loseItem'; itemId: string }
  | { kind: 'loseRandomItem' }

/** `gold` con `amount > 0` suma, con `amount < 0` resta. */
export type ChoiceOutcome =
  | { kind: 'reward'; effects: Effect[]; flavor: string }
  | { kind: 'punishment'; effects: Effect[]; flavor: string }
  | { kind: 'ambush'; flavor: string }
  | { kind: 'noop'; flavor: string }

export interface CuriosityChoice {
  id: string
  label: string
  outcome: ChoiceOutcome
}

export interface CuriosityEvent {
  id: string
  title: string
  flavor: string
  choices: CuriosityChoice[]
}

// ============================================================================
// Contexto y resultados de la resolucion.
// ============================================================================

export interface EventContext {
  heroes: Hero[]
  teamItems: string[]
}

export type AppliedEffect =
  | { kind: 'gold'; heroName: string; delta: number }
  | { kind: 'xp'; heroName: string; delta: number }
  | { kind: 'heal'; heroName: string; delta: number }
  | { kind: 'fullHeal'; heroName: string }
  | { kind: 'restoreEnergy'; heroName: string; delta: number }
  | { kind: 'energyLoss'; heroName: string; delta: number }
  | { kind: 'damage'; heroName: string; delta: number }
  | { kind: 'grantItem'; itemId: string }
  | { kind: 'loseItem'; itemId: string }

export type ResolveResult =
  | { kind: 'effects-applied'; log: string[]; effects: AppliedEffect[] }
  | { kind: 'ambush'; flavor: string }
  | { kind: 'noop'; flavor: string }

// ============================================================================
// Motor de resolucion (puro, sin dependencias de Pinia/Vue).
// ============================================================================

export function resolveCuriosityChoice(
  choice: CuriosityChoice,
  ctx: EventContext
): ResolveResult {
  const outcome = choice.outcome

  if (outcome.kind === 'ambush') {
    return { kind: 'ambush', flavor: outcome.flavor }
  }
  if (outcome.kind === 'noop') {
    return { kind: 'noop', flavor: outcome.flavor }
  }

  const effects: AppliedEffect[] = []
  for (const eff of outcome.effects) {
    effects.push(...applyEffect(eff, ctx))
  }

  return { kind: 'effects-applied', log: [outcome.flavor], effects }
}

function applyEffect(eff: Effect, ctx: EventContext): AppliedEffect[] {
  const living = ctx.heroes.filter(h => h.isAlive)
  const out: AppliedEffect[] = []

  switch (eff.kind) {
    case 'gold': {
      if (eff.amount === 0 || living.length === 0) break
      if (eff.amount > 0) {
        const perHero = Math.floor(eff.amount / living.length)
        const remainder = eff.amount - perHero * living.length
        living.forEach((h, i) => {
          const amt = perHero + (i === 0 ? remainder : 0)
          if (amt > 0) {
            h.addGold(amt)
            out.push({ kind: 'gold', heroName: h.name, delta: amt })
          }
        })
      } else {
        const total = Math.abs(eff.amount)
        const perHero = Math.floor(total / living.length)
        const remainder = total - perHero * living.length
        living.forEach((h, i) => {
          const amt = perHero + (i === 0 ? remainder : 0)
          if (amt > 0 && h.spendGold(amt)) {
            out.push({ kind: 'gold', heroName: h.name, delta: -amt })
          }
        })
      }
      break
    }
    case 'xp':
      living.forEach(h => {
        h.gainExperience(eff.amount)
        out.push({ kind: 'xp', heroName: h.name, delta: eff.amount })
      })
      break
    case 'heal':
      living.forEach(h => {
        const before = h.health
        h.heal(eff.amount)
        const delta = h.health - before
        if (delta > 0) out.push({ kind: 'heal', heroName: h.name, delta })
      })
      break
    case 'fullHeal':
      living.forEach(h => {
        if (h.health < h.maxHealth) {
          h.health = h.maxHealth
          out.push({ kind: 'fullHeal', heroName: h.name })
        }
      })
      break
    case 'restoreEnergy':
      living.forEach(h => {
        const delta = h.restoreEnergy(eff.amount)
        if (delta > 0) out.push({ kind: 'restoreEnergy', heroName: h.name, delta })
      })
      break
    case 'energyLoss':
      living.forEach(h => {
        const lost = Math.min(h.energy, eff.amount)
        if (lost > 0) {
          h.spendEnergy(lost)
          out.push({ kind: 'energyLoss', heroName: h.name, delta: lost })
        }
      })
      break
    case 'damage':
      living.forEach(h => {
        const before = h.health
        h.takeDamage(eff.amount)
        const dealt = before - h.health
        if (dealt > 0) out.push({ kind: 'damage', heroName: h.name, delta: dealt })
      })
      break
    case 'grantItem':
      ctx.teamItems.push(eff.itemId)
      out.push({ kind: 'grantItem', itemId: eff.itemId })
      break
    case 'loseItem': {
      const idx = ctx.teamItems.indexOf(eff.itemId)
      if (idx >= 0) {
        ctx.teamItems.splice(idx, 1)
        out.push({ kind: 'loseItem', itemId: eff.itemId })
      }
      break
    }
    case 'loseRandomItem': {
      if (ctx.teamItems.length === 0) break
      const idx = Math.floor(Math.random() * ctx.teamItems.length)
      const removed = ctx.teamItems.splice(idx, 1)[0]
      if (removed) out.push({ kind: 'loseItem', itemId: removed })
      break
    }
  }
  return out
}

// ============================================================================
// Catalogo de eventos "??" estilo Slay the Spire. Cada uno mezcla los cuatro
// kinds de outcome (reward / punishment / ambush / noop) y, dentro de reward
// y punishment, se pueden apilar varios `Effect` para crear tradeoffs.
// ============================================================================

export const CURIOSITY_EVENTS: CuriosityEvent[] = [
  {
    id: 'suspicious-chest',
    title: 'El cofre sospechoso',
    flavor:
      'Un cofre de roble descansa al borde del camino. La cerradura parece demasiado nueva para llevar tanto tiempo aqui abandonada.',
    choices: [
      {
        id: 'open-carefully',
        label: 'Abrirlo con cuidado',
        outcome: {
          kind: 'reward',
          flavor:
            'Dentro solo hay vendas y un pequeno saco de monedas. Tu grupo se siente revitalizado.',
          effects: [
            { kind: 'heal', amount: 15 },
            { kind: 'gold', amount: 20 }
          ]
        }
      },
      {
        id: 'force-lock',
        label: 'Forzar la cerradura',
        outcome: {
          kind: 'punishment',
          flavor:
            'Una aguja oxidada te pincha el dedo y el mecanismo estalla. Pero al fondo... hay un flask misterioso.',
          effects: [
            { kind: 'damage', amount: 8 },
            { kind: 'grantItem', itemId: 'healing-flask' },
            { kind: 'gold', amount: 25 }
          ]
        }
      },
      {
        id: 'walk-away',
        label: 'Pasar de largo',
        outcome: {
          kind: 'noop',
          flavor:
            'Decides no arriesgarte. El cofre sigue ahi, intacto, esperando a otro incauto.'
        }
      }
    ]
  },
  {
    id: 'hermits-offering',
    title: 'El ermitano de la colina',
    flavor:
      'Un anciano envuelto en harapos te ofrece una taza humeante. Huele a romero y miel.',
    choices: [
      {
        id: 'accept-tea',
        label: 'Aceptar su medicina',
        outcome: {
          kind: 'reward',
          flavor:
            'La infusion te vigoriza. Sales del encuentro mas fuerte y sabio.',
          effects: [
            { kind: 'fullHeal' },
            { kind: 'restoreEnergy', amount: 30 },
            { kind: 'xp', amount: 25 }
          ]
        }
      },
      {
        id: 'decline',
        label: 'Rechazar y seguir caminando',
        outcome: {
          kind: 'noop',
          flavor:
            'El anciano suspira y vuelve a su retiro. Pierdes la oportunidad, pero ahorras tiempo.'
        }
      },
      {
        id: 'insult',
        label: 'Insultarlo y robarle la bolsa',
        outcome: {
          kind: 'ambush',
          flavor:
            'El anciano no era quien parecia. Tres bandidos salen de entre los arbustos con los cuchillos desenvainados.'
        }
      }
    ]
  },
  {
    id: 'runic-door',
    title: 'La puerta runica',
    flavor:
      'Una puerta de piedra cubierta de simbolos antiguos bloquea el paso. Los simbolos pulsan con una luz palida.',
    choices: [
      {
        id: 'touch-symbol',
        label: 'Tocar el simbolo central',
        outcome: {
          kind: 'punishment',
          flavor:
            'Una descarga te atraviesa. Pero la puerta se abre y al otro lado hay un cofre.',
          effects: [
            { kind: 'energyLoss', amount: 25 },
            { kind: 'grantItem', itemId: 'energy-potion' },
            { kind: 'xp', amount: 40 }
          ]
        }
      },
      {
        id: 'study-it',
        label: 'Estudiarla con paciencia',
        outcome: {
          kind: 'reward',
          flavor:
            'Descifras los simbolos. La puerta se abre silenciosamente y recibes una vision del pasado.',
          effects: [
            { kind: 'xp', amount: 30 }
          ]
        }
      },
      {
        id: 'break-it',
        label: 'Romperla por la fuerza',
        outcome: {
          kind: 'ambush',
          flavor:
            'El estruendo despierta a los guardianes de la camara. Dos golems de piedra avanzan hacia ti.'
        }
      }
    ]
  },
  {
    id: 'wishing-well',
    title: 'El pozo de los deseos',
    flavor:
      'Un antiguo pozo de piedra se alza en un claro del bosque. El agua es tan oscura que no refleja nada. Brillan monedas en el fondo.',
    choices: [
      {
        id: 'toss-coin',
        label: 'Tirar una moneda y pedir un deseo',
        outcome: {
          kind: 'punishment',
          flavor:
            'El agua ruge y te arranca varias monedas de la bolsa. Pero al subir tu recompensa, el agua devuelve un vial brillante.',
          effects: [
            { kind: 'gold', amount: -30 },
            { kind: 'grantItem', itemId: 'energy-potion' }
          ]
        }
      },
      {
        id: 'drink-water',
        label: 'Beber del agua oscura',
        outcome: {
          kind: 'reward',
          flavor:
            'Un frio antiguo recorre tu espalda. Sales renovado y con los sentidos agudizados.',
          effects: [
            { kind: 'fullHeal' },
            { kind: 'xp', amount: 35 }
          ]
        }
      },
      {
        id: 'ignore-well',
        label: 'Ignorar el pozo',
        outcome: {
          kind: 'noop',
          flavor:
            'Algo te dice que es mejor no tentar a la suerte. Sigues tu camino.'
        }
      }
    ]
  },
  {
    id: 'sleeping-dragon-whelp',
    title: 'La cria de dragon dormida',
    flavor:
      'Una cria de dragon duerme enrollada sobre un monticulo de monedas y huesos. Respira con un silbido grave y pacifico.',
    choices: [
      {
        id: 'sneak-past',
        label: 'Pasar en silencio',
        outcome: {
          kind: 'reward',
          flavor:
            'Te arrastras entre las sombras. La cria no se mueve. Aprendes a moverte sin ruido de la experiencia.',
          effects: [
            { kind: 'xp', amount: 20 }
          ]
        }
      },
      {
        id: 'pet-it',
        label: 'Acariciarla',
        outcome: {
          kind: 'ambush',
          flavor:
            'La cria abre un ojo. Luego el otro. Luego una llamarada. Su madre aparece en el cielo.'
        }
      },
      {
        id: 'loot-it',
        label: 'Robarle las monedas mientras duerme',
        outcome: {
          kind: 'punishment',
          flavor:
            'Agarras un puñado, pero las escamas te cortan las manos. Sales corriendo con el botin y las palmas sangrando.',
          effects: [
            { kind: 'damage', amount: 10 },
            { kind: 'gold', amount: 40 }
          ]
        }
      }
    ]
  },
  {
    id: 'talking-statue',
    title: 'La estatua que susurra',
    flavor:
      'Una estatua de marmol con los ojos vacios murmura algo incomprensible. Si te acercas, repite una frase distinta cada vez.',
    choices: [
      {
        id: 'answer-riddle',
        label: 'Responder a su acertijo',
        outcome: {
          kind: 'reward',
          flavor:
            'Adivinas la respuesta. La estatua sonrie y una lluvia de monedas cae de su boca.',
          effects: [
            { kind: 'xp', amount: 25 },
            { kind: 'gold', amount: 30 }
          ]
        }
      },
      {
        id: 'taunt-statue',
        label: 'Insultarla',
        outcome: {
          kind: 'punishment',
          flavor:
            'La piedra se agrieta y una mano fria te empuja. Te alejas magullado.',
          effects: [
            { kind: 'damage', amount: 12 }
          ]
        }
      },
      {
        id: 'bow-respectfully',
        label: 'Hacer una reverencia respetuosa',
        outcome: {
          kind: 'noop',
          flavor:
            'La estatua vuelve al silencio. No obtienes nada, pero tampoco pierdes nada.'
        }
      }
    ]
  },
  {
    id: 'dead-adventurer',
    title: 'El cadaver del aventurero',
    flavor:
      'Un cuerpo sin nombre yace apoyado contra una roca. La espada esta intacta, pero la mochila esta abierta y vacia.',
    choices: [
      {
        id: 'search-body',
        label: 'Registrar el cadaver',
        outcome: {
          kind: 'punishment',
          flavor:
            'Una trampa con aguja te pincha el dedo. Pero bajo la capa encuentras un flask y unas monedas.',
          effects: [
            { kind: 'damage', amount: 5 },
            { kind: 'grantItem', itemId: 'healing-flask' },
            { kind: 'gold', amount: 18 }
          ]
        }
      },
      {
        id: 'pray-for-him',
        label: 'Rezar una oracion por el',
        outcome: {
          kind: 'reward',
          flavor:
            'Un calido sentimiento te recorre. La mochila vacia del cadaver se siente ligera.',
          effects: [
            { kind: 'heal', amount: 25 },
            { kind: 'xp', amount: 15 }
          ]
        }
      },
      {
        id: 'leave-him',
        label: 'Dejarlo en paz',
        outcome: {
          kind: 'noop',
          flavor:
            'No es tu botin. Sigues adelante con la conciencia tranquila.'
        }
      }
    ]
  },
  {
    id: 'phantom-mirror',
    title: 'El espejo fantasma',
    flavor:
      'Un espejo de marco dorado cuelga del aire, sin paredes que lo sostengan. Tu reflejo te devuelve una mirada cansada.',
    choices: [
      {
        id: 'gaze-into',
        label: 'Mirarte fijamente',
        outcome: {
          kind: 'punishment',
          flavor:
            'Tu reflejo ataca primero. Recibes tu propio golpe, pero tambien ganas una revelacion.',
          effects: [
            { kind: 'damage', amount: 14 },
            { kind: 'xp', amount: 50 }
          ]
        }
      },
      {
        id: 'smash-it',
        label: 'Romperlo',
        outcome: {
          kind: 'punishment',
          flavor:
            'Los cristales cortan tus brazos, pero el marco se rompe dejando escapar un saco de oro.',
          effects: [
            { kind: 'damage', amount: 8 },
            { kind: 'gold', amount: 35 }
          ]
        }
      },
      {
        id: 'walk-past',
        label: 'Pasar de largo',
        outcome: {
          kind: 'noop',
          flavor:
            'Cruzas sin mirar. El espejo sigue colgado alli, esperando.'
        }
      }
    ]
  },
  {
    id: 'goblin-merchant',
    title: 'El mercader goblin',
    flavor:
      'Un goblin con un carrito oxidado te ofrece wares dudosos. Tiene una sonrisa demasiado amplia y los dientes demasiado afilados.',
    choices: [
      {
        id: 'buy-flask',
        label: 'Comprar un flask a precio regalado (5 oro)',
        outcome: {
          kind: 'punishment',
          flavor:
            'El flask funciona, pero el mercader te roba tres monedas mas de la bolsa mientras te lo pasa.',
          effects: [
            { kind: 'gold', amount: -8 },
            { kind: 'grantItem', itemId: 'healing-flask' }
          ]
        }
      },
      {
        id: 'rob-merchant',
        label: 'Robarle el carrito',
        outcome: {
          kind: 'ambush',
          flavor:
            'El goblin da un silbido. Sus primos salen de debajo del carrito y de los arbustos.'
        }
      },
      {
        id: 'walk-past-merchant',
        label: 'Pasar de largo',
        outcome: {
          kind: 'noop',
          flavor:
            'No necesitas nada. El goblin sigue gritandote ofertas a tus espaldas.'
        }
      }
    ]
  },
  {
    id: 'travelling-bard',
    title: 'El bardo itinerante',
    flavor:
      'Un bardo toca una melodia triste junto a una fogata. Te ofrece sitio y una cancion.',
    choices: [
      {
        id: 'listen-song',
        label: 'Escuchar su cancion',
        outcome: {
          kind: 'reward',
          flavor:
            'La melodia te llena de inspiracion. Sales mas sabio y descansado.',
          effects: [
            { kind: 'xp', amount: 30 },
            { kind: 'restoreEnergy', amount: 40 }
          ]
        }
      },
      {
        id: 'ignore-bard',
        label: 'Seguir tu camino',
        outcome: {
          kind: 'noop',
          flavor:
            'El bardo se encoge de hombros y sigue tocando para las moscas.'
        }
      },
      {
        id: 'steal-lute',
        label: 'Robarle la laud',
        outcome: {
          kind: 'ambush',
          flavor:
            'El bardo no opuso resistencia... pero los bandidos que le debian dinero si.'
        }
      }
    ]
  }
]

export function pickRandomCuriosityEvent(): CuriosityEvent {
  const idx = Math.floor(Math.random() * CURIOSITY_EVENTS.length)
  return CURIOSITY_EVENTS[idx]!
}

export function getCuriosityEventById(id: string): CuriosityEvent | undefined {
  return CURIOSITY_EVENTS.find(e => e.id === id)
}
