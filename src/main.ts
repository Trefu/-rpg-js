import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const splash = (window as any).__splash as {
  setProgress: (p: number, label?: string) => void
  ready: () => void
  fail: (msg?: string) => void
} | undefined

const MENU_MUSIC_URL = '/assets/music/menu_ost.mp3'

function warmAsset(url: string): Promise<void> {
  return fetch(url, { method: 'HEAD', cache: 'force-cache' })
    .catch(() => undefined)
    .then(() => undefined)
}

async function preloadMenuMusic(): Promise<void> {
  splash?.setProgress(0.1, 'Conectando...')
  await warmAsset(MENU_MUSIC_URL)
  splash?.setProgress(1, 'Listo')
}

function mountApp(): void {
  const app = createApp(App)
  app.use(createPinia())
  app.mount('#app')
}

;(window as any).__startApp = () => {
  queueMicrotask(mountApp)
}

async function bootstrap(): Promise<void> {
  try {
    await preloadMenuMusic()
  } catch (err) {
    console.error('[boot] preload failed', err)
    splash?.fail('No se pudo cargar la musica del menu.')
    return
  }

  splash?.ready()
}

void bootstrap()
