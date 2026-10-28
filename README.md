# El Hincha — web

Tienda (cliente) y panel de administración de El Hincha, Machala – Ecuador.
Next.js 16 (App Router) + React 19 + Tailwind CSS 4. **Siempre pnpm.**

## Ejecutar con datos de prueba

```sh
pnpm install
pnpm dev            # http://localhost:3000  (tienda)  ·  /admin  (panel)
```

Mientras el back no esté conectado, todo funciona con una base de prueba **en memoria**
(`src/lib/data/mock-db.ts`): los pedidos, drops y cambios del admin se pierden al reiniciar
el servidor. El panel muestra un aviso de «modo de prueba» y un botón para reiniciar datos.

Para ver el estado «sin drop» (cuenta regresiva en 00:00:00 y carrito en pausa), cierra el
drop desde `/admin/drops`.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` / `pnpm start` | Build de producción (salida `standalone` para Docker) |
| `pnpm typecheck` | TypeScript estricto |
| `pnpm lint` | ESLint |
| `pnpm test` | Pruebas de reglas de negocio (dorsal, precios, WhatsApp) |

## Estructura

```
src/
  app/(tienda)/        tienda: inicio, ficha de producto, acción de pedido
  app/admin/           panel de administración
  components/tienda/   componentes de la tienda
  components/admin/    componentes del panel
  components/dorsal/   vista previa del dorsal (silueta genérica)
  lib/domain/          reglas de negocio puras + pruebas
  lib/data/            acceso a datos (hoy: base de prueba; luego: API interna)
  lib/cart/            carrito (zustand + localStorage)
public/brand/          logo vectorizado y siluetas (SVG)
public/mock/           fotos de muestra (se reemplazan por las del admin)
```

## Reglas que respeta el front

- **Sin secretos.** El front no necesita ninguno. `API_INTERNAL_URL` apunta a la API por la
  red interna de Docker y solo se usa desde el servidor. Nunca crear variables `NEXT_PUBLIC_*`
  con datos internos o sensibles.
- **El precio que manda es el del servidor.** El carrito muestra precios, pero el pedido se
  recalcula en el servidor con los precios vigentes.
- **Dorsal:** nombre opcional de hasta 10 caracteres contando espacios, mayúsculas, con Ñ,
  tildes, apóstrofe, punto y guion. Número 0–99 guardado como texto («07» ≠ «7»). El short
  solo lleva número. La vista previa usa una silueta genérica y una fuente libre: es referencial.
- **Drop:** solo hay un drop abierto a la vez. Sin drop abierto el carrito se bloquea.
- **Reserva fija** (hoy $5); el resto se coordina por WhatsApp.

## Docker

`Dockerfile` multi-etapa (node:24-alpine, pnpm vía corepack, salida standalone, usuario
`node`). Lo orquesta [elIncha_docker_build](https://github.com/RocketSoftwareDev/elIncha_docker_build).

Fotos de muestra: Unsplash (licencia Unsplash) e imágenes generadas para el diseño.
