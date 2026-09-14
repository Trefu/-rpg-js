import type { VfxAssetId } from '@/core/interfaces/IAbility'

import fireSlashDown from '@/assets/VFX/SlashEffect_2d_pack/GIF/Fire_slash_Down.gif'
import fireSlashUp from '@/assets/VFX/SlashEffect_2d_pack/GIF/Fire_slash_Up.gif'
import holySlashDown from '@/assets/VFX/SlashEffect_2d_pack/GIF/holy_slash_down.gif'
import holySlashUp from '@/assets/VFX/SlashEffect_2d_pack/GIF/holy_slash_up.gif'
import physicalSlash1 from '@/assets/VFX/basic slashs/Basic Slash 1/orange/GIF.gif'
import physicalSlash2 from '@/assets/VFX/basic slashs/Basic Slash 2/orange/GIF.gif'
import physicalSlash3 from '@/assets/VFX/basic slashs/Basic Slash 3/orange/GIF.gif'
import enemySlash1 from '@/assets/VFX/basic slashs/VFX 1/VFX1_GIF.gif'
import enemySlash2 from '@/assets/VFX/basic slashs/VFX 2/VFX2_GIF.gif'
import enemySlash3 from '@/assets/VFX/basic slashs/VFX 3/VFX3_GIF.gif'
import enemySlash4 from '@/assets/VFX/basic slashs/VFX 4/VFX4_GIF.gif'
import enemySlash5 from '@/assets/VFX/basic slashs/VFX 5 critical/VFX5_GIF.gif'
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
  'physical-slash-1': physicalSlash1,
  'physical-slash-2': physicalSlash2,
  'physical-slash-3': physicalSlash3,
  'enemy-slash-1': enemySlash1,
  'enemy-slash-2': enemySlash2,
  'enemy-slash-3': enemySlash3,
  'enemy-slash-4': enemySlash4,
  'enemy-slash-5': enemySlash5,
  'impact': impactGif,
  'big-hit': bigHitGif
}
