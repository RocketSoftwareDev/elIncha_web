# El Hincha — web

Tienda (cliente) y panel de administración de El Hincha, Machala – Ecuador.
Next.js 16 (App Router) + React 19 + Tailwind CSS 4. **Siempre pnpm.**

**Etapa actual (≈3 meses, gratis):** una sola app en **Netlify** que guarda todo en **Supabase**.
Después se separa en front + back (`elIncha_back`) en el VPS con `elIncha_docker_build`.

## Ejecutar en local (datos de prueba)

```sh
pnpm install
pnpm dev            # http://localhost:3000  (tienda)  ·  /admin  (panel)
```

Sin variables de Supabase, todo funciona con una base de prueba **en memoria**: los cambios se
pierden al reiniciar. El admin queda abierto y muestra el aviso «modo de prueba».
Para ver el estado «sin drop», cierra el drop desde `/admin/drops`.

## Publicar en Netlify + Supabase

### 1. Supabase (base de datos y fotos)

1. Crea un proyecto en [supabase.com](https://supabase.com) (plan Free, región `us-east-1`).
2. **SQL Editor** → ejecuta en orden:
   - `supabase/migraciones/0001_esquema.sql` (tablas, RLS cerrado, bucket de fotos, limpieza diaria)
   - `supabase/migraciones/0002_datos_iniciales.sql` (tipos de prenda, precios, parches, combo, ligas, ajustes)
   - `supabase/migraciones/0003_demo_opcional.sql` *(opcional)* catálogo y drop de demostración
   - `supabase/migraciones/0004_escudos.sql` (escudos de equipos)
   - `supabase/migraciones/0005_eliminar_en_cascada.sql` (eliminar una liga borra sus equipos y camisetas de una vez)

   Imágenes en el bucket `fotos` (las carpetas se crean solas al subir desde el admin):
   `productos/{id}/` fotos de camisetas · `ligas/{id}/` círculo de la liga · `equipos/{id}/` escudo.
3. **Project Settings → API**: copia la **Project URL** y la llave **service_role**.
4. **Authentication → Sign In / Providers**: desactiva «Allow new users to sign up» (no se usa
   el login de Supabase; así nadie puede crear cuentas).

### 2. Contraseña del admin

```sh
pnpm clave-admin
```

Pide la contraseña (mín. 12 caracteres) sin mostrarla e imprime `ADMIN_PASSWORD_HASH` y
`SESSION_SECRET`. No se guardan en ningún archivo.

### 3. Netlify

En **Site configuration → Environment variables** (marca *Contains secret values* en las secretas):

| Variable | Secreta | Valor |
| --- | --- | --- |
| `SUPABASE_URL` | No | Project URL de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | **Sí** | llave `service_role` (nunca en el navegador) |
| `ADMIN_PASSWORD_HASH` | **Sí** | salida de `pnpm clave-admin` |
| `SESSION_SECRET` | **Sí** | salida de `pnpm clave-admin` |
| `SITIO_HOST` | No | dominio del sitio, ej. `elhincha.netlify.app` (para clasificar visitas) |

Luego **Deploys → Trigger deploy**. `netlify.toml` ya trae el comando de build y Node 22.

> Si faltan las variables de Supabase, la tienda **falla a la vista** en vez de usar datos de
> prueba: así nunca se pierden pedidos de clientes reales en silencio.

### 4. Que Supabase no se duerma

Supabase gratis se pausa tras **7 días sin uso**. La tarea `.github/workflows/mantener-activo.yml`
visita `/api/salud` cada 3 días. Actívala en GitHub → **Settings → Secrets and variables →
Actions → Variables** → `SITIO_URL` = `https://tu-sitio.netlify.app`.

### 5. Primer ingreso

`/admin/login` → contraseña → **Ajustes y pagos**: pon el número real de WhatsApp. Luego carga
equipos, camisetas y fotos, y abre el drop.

## Seguridad (lo que protege a la tienda)

- **Base cerrada:** RLS activado en todas las tablas y sin políticas. La llave pública de
  Supabase no lee ni escribe nada; solo el servidor de Netlify, con la llave de servicio.
- **Admin:** contraseña con scrypt, sesión en cookie `httpOnly` + `SameSite=strict` firmada con
  HMAC, 8 horas. Bloqueo tras 5 intentos fallidos en 15 minutos. Cambiar la contraseña cierra
  todas las sesiones. **Cada página, acción y ruta** del admin verifica la firma (el `proxy` solo
  redirige; no es la protección).
- **Precios en el servidor:** el pedido se recalcula con los precios de la base; el navegador
  no puede cambiar montos.
- **Límites contra abuso:** 4 pedidos cada 10 min y 60 avisos de estadísticas cada 10 min por
  visitante; la IP se toma de `x-nf-client-connection-ip` (no se puede falsificar en Netlify).
- **Fotos:** el navegador las reduce a 1200 px WebP; el servidor revisa el contenido real
  (no la extensión), máx. 1,5 MB, 6 por camiseta. El bucket solo acepta WebP de 2 MB.
- **Cabeceras:** HSTS, `nosniff`, `X-Frame-Options: DENY`, admin sin caché y sin indexar.
- **Datos personales:** las estadísticas no guardan IP ni cookies; el identificador del
  visitante es un hash diario con secreto del servidor.

**Lo que el plan gratis NO cubre:** protección avanzada contra ataques de tráfico (DDoS). Netlify
absorbe ataques básicos, pero alguien podría gastar a propósito los créditos del mes. Si eso
pasa o crece el tráfico: poner un dominio propio detrás de Cloudflare (gratis) o pasar al VPS.

## ¿Cuánto dura gratis?

No hay fecha de vencimiento: dura **mientras el uso del mes quepa en los planes gratis**.

| Servicio | Límite gratis | Qué pasa si se supera |
| --- | --- | --- |
| Netlify | 300 créditos por ciclo (cada deploy de producción = 15; 20 por GB de tráfico; 2 por 10 000 solicitudes) | El sitio queda **pausado** hasta el siguiente ciclo |
| Supabase | 500 MB de base, 1 GB de fotos, 5 GB de tráfico al mes | Avisos y luego limitación; sin respaldos automáticos |
| Supabase | Se pausa tras 7 días sin uso | Lo evita la tarea de GitHub |

Para cuidar los créditos: **pocos deploys** (agrupa cambios; ~5 al mes = 75 créditos) y fotos
livianas (ya se suben en WebP). Con ~2 500 visitas al mes la tienda queda holgada; si pasa de
~5 000 visitas al mes, conviene adelantar el VPS. **Respaldo:** sin respaldos automáticos en el
plan gratis, exporta los pedidos de cada drop desde el admin («Lista para el proveedor»).

## Scripts

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` / `pnpm start` | Build de producción (en Netlify sin `standalone`; en Docker con `standalone`) |
| `pnpm typecheck` · `pnpm lint` · `pnpm test` | Tipos, lint y pruebas |
| `pnpm clave-admin` | Genera `ADMIN_PASSWORD_HASH` y `SESSION_SECRET` |

## Estructura

```
src/
  app/(tienda)/        tienda: inicio, vitrina, ficha de producto, acción de pedido
  app/admin/           panel (login, resumen, drops, pedidos, catálogo, precios, ajustes)
  app/api/e            avisos de estadísticas · app/api/salud  ping para Supabase
  lib/data/repo/       almacenamiento: supabase.ts (Netlify) · memoria.ts (local)
  lib/data/            reglas de tienda, admin y estadísticas sobre el repositorio
  lib/auth/            contraseña (scrypt) y sesión firmada
  lib/domain/          reglas de negocio puras + pruebas
supabase/migraciones/  SQL para crear la base en Supabase
public/brand/          logo vectorizado y siluetas (SVG)
public/mock/           fotos de muestra
```

## Reglas del negocio

- **Dorsal:** nombre opcional de hasta 10 caracteres contando espacios, mayúsculas, con Ñ,
  tildes, apóstrofe, punto y guion. Número 0–99 guardado como texto («07» ≠ «7»). El short
  solo lleva número. La vista previa es referencial (silueta genérica y fuente libre).
- **Drop:** solo uno abierto a la vez (lo garantiza la base). Sin drop, el carrito se bloquea.
- **Precios** por tipo de prenda; combos que el cliente elige; parches $1; **reserva fija** $5.
- **WhatsApp:** el enlace va a `api.whatsapp.com/send` (la redirección de `wa.me` daña el ⚽).

## Docker (etapa VPS)

`Dockerfile` multi-etapa (node:24-alpine, pnpm vía corepack, salida standalone, usuario `node`).
Lo orquesta [elIncha_docker_build](https://github.com/RocketSoftwareDev/elIncha_docker_build).

Fotos de muestra: Unsplash (licencia Unsplash) e imágenes generadas para el diseño.
