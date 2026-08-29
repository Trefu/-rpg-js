import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useMediaQuery(query: string) {
  const matches = ref(false)
  let mql: MediaQueryList | null = null
  const update = () => {
    if (mql) matches.value = mql.matches
  }
  onMounted(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    mql = window.matchMedia(query)
    matches.value = mql.matches
    if (mql.addEventListener) mql.addEventListener('change', update)
    else mql.addListener(update)
  })
  onBeforeUnmount(() => {
    if (!mql) return
    if (mql.removeEventListener) mql.removeEventListener('change', update)
    else mql.removeListener(update)
  })
  return matches
}
