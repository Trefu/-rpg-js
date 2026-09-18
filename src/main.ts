import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { VFX_SOURCES } from './components/combat/vfxSources'

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
}

function decodeImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      img.decode().catch(() => undefined).then(() => resolve())
    }
    img.onerror = () => resolve()
    img.src = url
  })
}

async function preloadVfxGifs(): Promise<void> {
  const urls = Object.values(VFX_SOURCES)
  const total = urls.length
  let done = 0

  splash?.setProgress(0.2, 'Precargando animaciones...')

  await Promise.all(
    urls.map(async (url) => {
      await decodeImage(url)
      done += 1
      // Mantener margen 0.2..1.0 para que la barra no salte de golpe al final.
      const p = 0.2 + (done / total) * 0.8
      splash?.setProgress(p, `Precargando animaciones (${done}/${total})`)
    })
  )
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
    await preloadVfxGifs()
  } catch (err) {
    console.error('[boot] preload failed', err)
    splash?.fail('No se pudo cargar la musica del menu.')
    return
  }

  splash?.setProgress(1, 'Listo')
  splash?.ready()
}

void bootstrap()
