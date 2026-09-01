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
  duration?: number
  sticky?: boolean
  priority?: number
  id?: string
}

interface ActiveAnnouncement extends Required<Omit<AnnouncementSpec, 'id'>> {
  id: string
  key: number
}

export interface Announcer {
  current: Readonly<ReturnType<typeof ref<ActiveAnnouncement | null>>>
  show: (
    text: string,
    variant?: AnnouncementVariant,
    duration?: number,
    options?: { sticky?: boolean; priority?: number; id?: string; interrupt?: boolean }
  ) => string
  enqueue: (spec: AnnouncementSpec) => string
  clear: () => void
  skip: () => void
  pending: () => number
}

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
    options?: { sticky?: boolean; priority?: number; id?: string; interrupt?: boolean }
  ): string {
    if (options?.interrupt) {
      clearTimer()
      current.value = null
      queue.length = 0
    }
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

export function __resetAnnouncerForTests() {
  _singleton = null
}
