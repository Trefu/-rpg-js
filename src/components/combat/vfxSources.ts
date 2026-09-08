import type { VfxAssetId } from '@/core/interfaces/IAbility'

import fireSlashDown from '@/assets/VFX/SlashEffect_2d_pack/GIF/Fire_slash_Down.gif'
import fireSlashUp from '@/assets/VFX/SlashEffect_2d_pack/GIF/Fire_slash_Up.gif'
import holySlashDown from '@/assets/VFX/SlashEffect_2d_pack/GIF/holy_slash_down.gif'
import holySlashUp from '@/assets/VFX/SlashEffect_2d_pack/GIF/holy_slash_up.gif'
import impactGif from '@/assets/VFX/Effect_Impact/Effect_Impact_15frames.gif'
import bigHitGif from '@/assets/VFX/Effect_BigHit/Effect_BigHit_12frames.gif'

/**
 * Mapa unico asset id -> URL del GIF. Compartido por `HeroCard`,
 * `EnemyCard` y `MobileCombatHud` para que cualquier consumidor que
 * renderice un `VfxEffect` use los mismos imports (evita duplicacion
 * de paths de Vite y reduce el bundle final).
 */
export const VFX_SOURCES: Record<VfxAssetId, string> = {
  'fire-slash-down': fireSlashDown,
  'fire-slash-up': fireSlashUp,
  'holy-slash-down': holySlashDown,
  'holy-slash-up': holySlashUp,
  'impact': impactGif,
  'big-hit': bigHitGif
}
