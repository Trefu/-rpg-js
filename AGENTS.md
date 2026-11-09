# Dirección visual de los menús

## Referencia concreta
- Menús de **Final Fantasy VI (SNES, 1994)**: ventanas de estado y listas de comandos. Es una referencia de composición e interacción, no una copia de sus recursos.
- Adaptación propia **ámbar / naranja quemado**. Debe parecer un menú de JRPG, no una web de producto.

## Reglas obligatorias
- Paleta compartida en `src/styles/campaign.css`: tinta marrón casi negra, ventanas marrón oscuro, bordes cobre, selección naranja y texto marfil. Usar las variables `--jrpg-*`; no inventar otra paleta por pantalla.
- Ventanas rectangulares, marcos dobles de pocos píxeles, sombras duras y pequeñas. Tipografía monoespaciada legible, cifras alineadas. Sprites sin distorsión.
- Navegación directa, sin columna ni barra de comandos redundantes en el campamento. Usar cursor triangular en listas seleccionables cuando aporte información. La selección se expresa también con texto, borde y `aria-pressed`, nunca solo con color.
- Héroes como filas de estado; tienda como lista de objetos con precio y acción. Jerarquía: nombre, estado/efecto, comando.
- Prohibidos: glassmorphism, blur, neón, degradados multicolor, cápsulas indiscriminadas, tarjetas de métricas, cabeceras hero de landing, copy corporativo y adornos sin función.
- No añadir textos grandilocuentes, etiquetas duplicadas ni inventar lore para rellenar huecos. Preferir «Grupo», «Equipo», «Objetos», «Salir».
- Conservar la vista previa de montaña, fórmulas de estadísticas, habilidades, compras y selección del grupo. Este estilo no autoriza cambios de balance ni de guardado.
- Mantener navegación por teclado, foco visible, contraste alto, controles táctiles de 44px y reflujo a 360px. Respetar `prefers-reduced-motion`.

## Organización y comprobaciones
- `campaign.css`: tokens y primitivas compartidas. `menus.css`: composición de las pantallas y ventanas de menú.
- Los estilos locales anteriores se aíslan en `@layer menu-legacy` para que no vuelvan a imponer paletas antiguas sobre el tema compartido. Los nuevos estilos de menú van en los archivos centrales, no en otra pila de overrides locales.
- No recolorear automáticamente sprites ni indicadores semánticos de combate. Vida, energía y efectos deben seguir distinguiéndose.
- Comprobar `npm run typecheck`, `npm run build`, `npm test`, `npm run test:menus`, `npm run test:campaign-ui` y `npm run test:company`. Revisar capturas de campamento, tienda y diálogos en escritorio y móvil.
