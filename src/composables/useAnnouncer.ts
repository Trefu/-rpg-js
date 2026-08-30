import { ref, readonly } from 'vue'

export type AnnouncementVariant =
  | 'info'
  | 'attack'
  | 'status'
  | 'turn'
  | 'crit'
  | 'crit-attack'

export interface AnnouncementSpec {
  text: string
  variant?: AnnouncementVariant
  /**
   * Cuanto tiempo (ms) permanece visible el banner antes de avanzar al
   * siguiente anuncio encolado. Default: 2000.
   */
  duration?: number
  /**
   * Si true, el anuncio nunca se borra solo: hay que llamar `clear()` o
   * `skip()` para que continue la cola. Default: false.
   */
  sticky?: boolean
  /**
   * Prioridad dentro de la cola. Mayor = sale antes. Default: 0.
   * Sugeridos: crit-attack = 10, attack = 5, turn = 5, status = 1, info = 0.
   */
  priority?: number
  /**
   * Identificador opcional para deduplicar. Si ya hay un anuncio encolado
   * o activo con el mismo id, el nuevo se descarta.
   */
  id?: string
}

interface ActiveAnnouncement extends Required<Omit<AnnouncementSpec, 'id'>> {
  id: string
  key: number
}

export interface Announcer {
  /** Ref reactivo con el anuncio actualmente visible. Solo lectura. */
  current: Readonly<ReturnType<typeof ref<ActiveAnnouncement | null>>>
  /**
   * API estilo "fire and forget". Reemplaza la firma antigua de
   * `showAnnouncement(text, variant, duration, { sticky })` para que el
   * resto del codigo siga funcionando sin cambios.
   */
  show: (
    text: string,
    variant?: AnnouncementVariant,
    duration?: number,
    options?: { sticky?: boolean; priority?: number; id?: string }
  ) => string
  /** Inserta un anuncio en la cola respetando prioridad/deduplicacion. */
  enqueue: (spec: AnnouncementSpec) => string
  /** Vacia la cola y limpia el banner actual. */
  clear: () => void
  /** Salta el banner actual y muestra el siguiente encolado (si hay). */
  skip: () => void
  /** Cantidad de anuncios pendientes en la cola (sin contar el activo). */
  pending: () => number
}

/**
 * Modulo singleton: mantiene UNA cola y UN banner activo para toda la app.
 * Asi, dos componentes distintos (ej. CombatView + un futuro HUD) pueden
 * despachar anuncios sin pisarse.
 */
function createAnnouncer(): Announcer {
  const queue: ActiveAnnouncement[] = []
  const current = ref<ActiveAnnouncement | null>(null)
  let timer: ReturnType<typeof setTimeout> | null = null
  let keyCounter = 0
  const DEFAULT_DURATION = 2000

  function clearTimer() {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  function makeActive(spec: AnnouncementSpec): ActiveAnnouncement {
    keyCounter += 1
    return {
      id: spec.id ?? `a-${keyCounter}-${Date.now().toString(36)}`,
      key: keyCounter,
      text: spec.text,
      variant: spec.variant ?? 'info',
      duration: spec.duration ?? DEFAULT_DURATION,
      sticky: spec.sticky ?? false,
      priority: spec.priority ?? 0
    }
  }

  /**
   * Selecciona el siguiente anuncio a mostrar: primero el activo actual
   * (para no interrumpirlo), si no hay, el de mayor prioridad de la cola.
   */
  function pickNext(): ActiveAnnouncement | null {
    if (queue.length === 0) return null
    let bestIdx = 0
    for (let i = 1; i < queue.length; i++) {
      if (queue[i].priority > queue[bestIdx].priority) bestIdx = i
    }
    return queue.splice(bestIdx, 1)[0]
  }

  function showActive(item: ActiveAnnouncement) {
    clearTimer()
    current.value = item
    if (item.sticky) return
    timer = setTimeout(() => {
      timer = null
      current.value = null
      advance()
    }, item.duration)
  }

  function advance() {
    const next = pickNext()
    if (next) showActive(next)
  }

  function enqueue(spec: AnnouncementSpec): string {
    const item = makeActive(spec)
    if (current.value?.id === item.id) return item.id
    if (queue.some(q => q.id === item.id)) return item.id
    queue.push(item)
    if (!current.value && timer === null) {
      advance()
    }
    return item.id
  }

  function show(
    text: string,
    variant?: AnnouncementVariant,
    duration?: number,
    options?: { sticky?: boolean; priority?: number; id?: string }
  ): string {
    return enqueue({
      text,
      variant,
      duration,
      sticky: options?.sticky,
      priority: options?.priority,
      id: options?.id
    })
  }

  function clear() {
    queue.length = 0
    clearTimer()
    current.value = null
  }

  function skip() {
    clearTimer()
    current.value = null
    advance()
  }

  function pending() {
    return queue.length
  }

  return {
    current: readonly(current) as Readonly<ReturnType<typeof ref<ActiveAnnouncement | null>>>,
    show,
    enqueue,
    clear,
    skip,
    pending
  }
}

let _singleton: Announcer | null = null

export function useAnnouncer(): Announcer {
  if (!_singleton) _singleton = createAnnouncer()
  return _singleton
}

/**
 * Helper de test/devuelve para resetear el singleton entre tests
 * (no se usa en runtime).
 */
export function __resetAnnouncerForTests() {
  _singleton = null
}
