# Caserita · Pagos con QR, pedidos de la casera y calificaciones

Qué se agregó (octubre 2026): la app ya no es solo una maqueta en el navegador. Ahora tiene un backend real (función de Vercel + Postgres) y el mismo flujo de verificación de pagos que tenía Yoboleo:

1. El vecino reserva y elige **QR**. Ve el QR de cobro de Caserita, el monto exacto y la glosa (`CASERITA` + código de retiro).
2. Paga desde su banco y **sube la captura** del comprobante. La app la achica y la manda.
3. La captura llega al **bot de Telegram** con los botones **Aceptar pago** y **Rechazar**.
4. Al aceptar, el pedido queda **pagado** y aparece en el **panel de la casera** (`/vendedor/pedidos`) con el código, el nombre y el celular del vecino. La app del vecino se actualiza sola.
5. Cuando el vecino recoge, la casera toca **Entregado**.
6. El vecino puede **calificar** a la casera (estrellas y comentario). El rating y las opiniones se ven en la ficha del puesto.

Si el vecino elige **efectivo**, el pedido llega igual a Telegram (sin botones) y la casera cobra al entregar. Si un comprobante se rechaza, el vecino lo ve y puede subir otro o pasar a efectivo. El delivery se quitó: por ahora Caserita es solo recojo.

## Lo que hay que configurar una sola vez (10 minutos)

### 1. Base de datos (Neon, gratis, desde Vercel)
En el proyecto de Vercel: **Storage → Create Database → Neon (Postgres) → Connect to project**. Vercel crea la variable `DATABASE_URL` sola. Las tablas y el catálogo inicial se crean solos la primera vez que la API responde.

### 2. Bot de Telegram
- En Telegram, hablar con **@BotFather → /newbot** (por ejemplo `CaseritaPagosBot`). Copiar el token.
  También sirve el bot de Yoboleo: la prueba de hoy se mandó con ese token y llegó.
- En Vercel → Settings → Environment Variables, agregar:
  - `TELEGRAM_BOT_TOKEN` = el token
  - `TELEGRAM_CHAT_ID` = el chat de quien verifica (el mismo número que usaba Yoboleo, o escribir `/id` al bot después del paso 3)
  - `TELEGRAM_WEBHOOK_SECRET` = cualquier texto largo al azar
  - `CASERITA_SECRETO` = otro texto largo al azar (es la clave de administrador)
  - `APP_URL` = `https://www.caserita.shop`
- Redesplegar (Deployments → Redeploy) para que tome las variables.

### 3. Registrar el webhook (una vez)
Abrir en el navegador:
`https://www.caserita.shop/api/telegram/configurar?clave=EL_VALOR_DE_CASERITA_SECRETO`
Debe responder `"ok": true`. Desde ese momento los botones de Telegram funcionan.

### 4. El QR de cobro
Reemplazar el archivo `caserita-app/public/qr-cobro.png` por la imagen del QR de la cuenta bancaria de Caserita (el mismo que se usa hoy). Hasta que se reemplace, la app muestra un cuadro que dice que falta el QR.

## Códigos de las caseras (para imprimir en su cartel)

| Puesto | Código |
|---|---|
| Pensión Doña Mari (La Ramada) | **4201** |
| Puesto 42 (La Ramada) | **4242** |
| Carrito de Don Grover (La Ramada) | **4207** |
| Pan de Doña Lidia | 1101 |
| Salteñas Doña Fela | 1103 |
| Api de Doña Nieves | 1104 |
| Tucumanas El Fogón | 1105 |
| Sándwich de chola Doña Justa | 1108 |
| Comedor popular del mercado | 1109 |

La casera entra en `caserita.shop/vendedor/pedidos`, escribe su código y queda conectada en ese celular. Ahí publica lo que le sobró, ve los pedidos con su código de retiro y marca "Entregado". Para cambiar un código: tabla `vendedores`, columna `pin`, en Neon.

## Para el administrador

- `https://www.caserita.shop/api/admin/reservas?clave=CASERITA_SECRETO` lista todos los pedidos (JSON).
- `https://www.caserita.shop/api/salud` dice si la base y Telegram están configurados.

## Cómo correrlo en la computadora

```bash
cd caserita-app && npm install
npm run api                      # API local en :3001 con un Postgres embebido (PGlite), sin Telegram: acepta los pagos solo
VITE_API_URL=http://localhost:3001 npm run dev   # la app, hablando con esa API
npm run dev                      # (sin VITE_API_URL) modo demo dentro del navegador, como antes
npm run test:api                 # prueba de punta a punta de la API (reserva, comprobante, entrega, calificación)
npm run typecheck:server         # tipos del backend
```

Para probar Telegram en local, crear `caserita-app/.env` con las variables del `.env.example` y correr `npm run api` con ellas cargadas (por ejemplo `npx dotenv -e .env -- npm run api`). El webhook solo funciona con un dominio público; en local el pago se acepta solo.

## Archivos nuevos

- `api/index.ts`: la función de Vercel. Todo `/api/*` entra por aquí.
- `server/app.ts`: la API (rutas y reglas). `server/db.ts` (Neon o PGlite), `server/esquema.ts` (tablas y catálogo inicial), `server/telegram.ts` (bot), `server/dev.ts` (servidor local), `server/prueba.ts` (prueba).
- `src/components/PanelPagoQr.tsx` (QR + subir comprobante), `Calificar.tsx`, `EntrarPuesto.tsx`; `src/pages/VendedorPedidos.tsx`; `src/lib/cliente.ts` (identidad del vecino sin login), `src/lib/imagen.ts` (compresión de la captura).
