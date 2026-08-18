# Caserita

Marketplace de bolsas sorpresa de comida rescatada en Santa Cruz de la Sierra.

## Piezas

| Carpeta | Qué es | Puerto |
|---|---|---|
| `caserita-api/` | Backend: Express + SQLite | 3001 |
| `caserita-app/` | App web instalable: React + Vite + Tailwind | 5173 (dev) · 4173 (producción) |

## Cómo levantarlo

### Modo demo (lo normal — sin backend)

La app trae un backend que corre **dentro del navegador** (`caserita-app/src/
services/localApi.ts`): mismos datos y misma lógica que el servidor, pero
guardando en `localStorage`. Basta con la app:

```bash
cd Caserita/caserita-app && npm install && npm run dev
```

Se abre `http://localhost:5173` y funciona sola, incluso sin conexión. Esto es
lo que se despliega en Vercel.

### Modo con backend real (opcional)

Si se quiere el servidor Express + SQLite (estado compartido entre
dispositivos, reservas transaccionales), hacen falta **dos terminales** y hay
que apuntar la app al backend con la variable `VITE_API_URL`:

```bash
cd Caserita/caserita-api && npm install && npm start
```

```bash
cd Caserita/caserita-app && VITE_API_URL=http://localhost:3001 npm run dev
```

Con `VITE_API_URL` definida, la app deja de usar el modo demo y habla por red
con el backend.

Para probar la versión instalable (el service worker solo corre en producción):

```bash
cd Caserita/caserita-app && npm run build && npm run preview
```

## Instalarla en el celular

Con `npm run preview` corriendo, en el teléfono (misma red wifi) se abre
`http://<ip-de-la-laptop>:4173`. En Android sale "Instalar app"; en iPhone se
usa Compartir y luego "Añadir a inicio". Queda con su ícono, sin barra de
navegador y con los mapas cacheados para que funcione con mala señal.

## La base de datos

Es un archivo `caserita-api/caserita.db`. Para volver al catálogo inicial:

```bash
curl -X POST http://localhost:3001/api/reiniciar
```

También está el botón "Reiniciar datos de la demo" en la pantalla de Perfil.

## Endpoints

```
GET    /api/bolsas                  catálogo con distancias reales calculadas
GET    /api/bolsas/:id
GET    /api/reservas
POST   /api/reservas                { bolsaId, metodoPago }  descuenta stock
PATCH  /api/reservas/:id/pago       { estado, referencia }
PATCH  /api/reservas/:id/recogida
DELETE /api/reservas/:id            cancela y devuelve la bolsa al stock
GET    /api/publicaciones           el estado se deriva del stock real
POST   /api/publicaciones           crea la publicación Y la bolsa del catálogo
POST   /api/deliveries              { reservaId }
GET    /api/deliveries/:id
GET    /api/usuario
POST   /api/reiniciar
GET    /api/salud
```

Reservar corre dentro de una transacción: si dos personas tocan "Reservar" a la
vez sobre la última bolsa, una recibe la reserva y la otra un 409. Eso es lo que
no se puede garantizar sin backend.

## Para desplegarlo

### Vercel (modo demo, recomendado)

La app es 100% estática y se despliega sola. En Vercel:

- **Root Directory:** `caserita-app`
- **Framework:** Vite (se detecta solo; ya hay un `vercel.json`)
- **Build:** `npm run build` · **Output:** `dist`
- **Sin variables de entorno:** al no existir `VITE_API_URL`, arranca en modo
  demo con el backend en el navegador.

Con la CLI, desde `caserita-app`:

```bash
npx vercel --prod
```

### Con backend real

Si se quiere el servidor de verdad: el backend va a un host con Node (Railway,
Render, Fly) y en Vercel se define `VITE_API_URL` con su URL pública. La app
vuelve a hablar por red automáticamente.

## Pendiente

El pago con QR sigue siendo una demostración: un QR Simple con validez bancaria
lo emite el banco adquirente (ACH Bolivia o Banco Unión) contra una cuenta de
comercio, y la confirmación llega por webhook. El código está preparado para ese
cambio: se reemplazan `construirPayload` y `confirmarPago` en
`caserita-app/src/services/pago.ts` y el resto del flujo queda igual.

Tampoco hay login: todas las peticiones son del mismo usuario (`u1`).

## Fotos del catálogo

Las fotos de comida vienen de Wikimedia Commons, casi todas bajo CC BY-SA 4.0.
Se recortaron a 800x600 y se recomprimieron; no se alteraron de otro modo. El
detalle de obra, autor, licencia y enlace está en
`caserita-app/public/CREDITOS-FOTOS.txt`, que la app sirve en
`/CREDITOS-FOTOS.txt`.

Si se reemplaza una foto hay que actualizar ese archivo: la licencia obliga a
citar autor y licencia, y a compartir las obras derivadas igual.
