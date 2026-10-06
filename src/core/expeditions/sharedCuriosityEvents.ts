import type { CuriosityEvent } from '@/core/events/curiosityEvents'

/**
 * Catalogo base de eventos "?" estilo Slay the Spire. Vive en `core/expeditions/`
 * (no en `core/events/`) porque cada expedicion puede sobreescribirlo o
 * heredarlo: las expediciones son las nuevas entidades dueñas del contenido
 * del dungeon.
 *
 * Las opciones marcadas con `kind: 'ambush'` declaran opcionalmente un
 * `encounter` (id dentro de `IExpeditionConfig.encounters`) para que el
 * combate resultante NO sea un re-roll aleatorio del pool, sino una
 * composicion fija y consistente con la narrativa del evento.
 */
export const SHARED_CURIOSITY_EVENTS: CuriosityEvent[] = [
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
            { kind: 'xpPercent', percent: 10 }
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
            'El anciano no era quien parecia. Tres bandidos salen de entre los arbustos con los cuchillos desenvainados.',
          encounter: 'bandit-ambush-3'
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
            { kind: 'xpPercent', percent: 15 }
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
            { kind: 'xpPercent', percent: 10 }
          ]
        }
      },
      {
        id: 'break-it',
        label: 'Romperla por la fuerza',
        outcome: {
          kind: 'ambush',
          flavor:
            'El estruendo despierta a los guardianes de la camara. Dos golems de piedra avanzan hacia ti.',
          encounter: 'stone-guardians-2'
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
            { kind: 'xpPercent', percent: 10 }
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
            { kind: 'xpPercent', percent: 5 }
          ]
        }
      },
      {
        id: 'pet-it',
        label: 'Acariciarla',
        outcome: {
          kind: 'ambush',
          flavor:
            'La cria abre un ojo. Luego el otro. Luego una llamarada. Su madre aparece en el cielo.',
          encounter: 'dragon-mother-arrives'
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
            { kind: 'xpPercent', percent: 10 },
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
            { kind: 'xpPercent', percent: 5 }
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
            { kind: 'xpPercent', percent: 15 }
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
            'El goblin da un silbido. Sus primos salen de debajo del carrito y de los arbustos.',
          encounter: 'goblin-cousins'
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
            { kind: 'xpPercent', percent: 10 },
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
            'El bardo no opuso resistencia... pero los bandidos que le debian dinero si.',
          encounter: 'bandits-debt'
        }
      }
    ]
  }
]
