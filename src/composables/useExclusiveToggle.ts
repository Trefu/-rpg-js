import { ref, computed, type ComputedRef } from 'vue'

const openId = ref<string | null>(null)

export function useExclusiveToggle(id: string): {
  isOpen: ComputedRef<boolean>
  open: () => void
  close: () => void
  toggle: () => void
} {
  const isOpen = computed(() => openId.value === id)

  function open() {
    openId.value = id
  }

  function close() {
    if (openId.value === id) openId.value = null
  }

  function toggle() {
    if (isOpen.value) close()
    else open()
  }

  return { isOpen, open, close, toggle }
}
