/**
 * Genera los iconos PNG de la app instalable a partir de un SVG.
 * Uso: node scripts/generar-iconos.mjs
 *
 * El símbolo es el carrito de comida callejera de la identidad de Caserita:
 * dos colores y sin detalles, para que se lea a 16 px en la pestaña y a 512 px
 * en la pantalla de inicio. Sobre verde va en su versión crema + naranja.
 */
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'

const VERDE = '#167A3C'
const NARANJA = '#F26522'
const CREMA = '#FFF7EA'

/**
 * El carrito dibujado en un lienzo de 200x200 (contenido real: x 18-182,
 * y 30-192). `base` pinta techo, postes, mostrador, marco y ruedas; las ollas
 * y el cuerpo siempre van en naranja.
 */
const carrito = (base) => `
  <path d="M18 60 L182 60 L166 30 L34 30 Z" fill="${base}"/>
  <rect x="42" y="60" width="8" height="56" fill="${base}"/>
  <rect x="150" y="60" width="8" height="56" fill="${base}"/>
  <ellipse cx="74" cy="112" rx="18" ry="7" fill="${NARANJA}"/>
  <ellipse cx="112" cy="112" rx="18" ry="7" fill="${NARANJA}"/>
  <rect x="30" y="114" width="140" height="18" rx="4" fill="${base}"/>
  <rect x="36" y="132" width="128" height="42" rx="4" fill="${NARANJA}"/>
  <rect x="36" y="132" width="128" height="42" rx="4" fill="none" stroke="${base}" stroke-width="6"/>
  <rect x="97" y="132" width="6" height="42" fill="${base}"/>
  <circle cx="62" cy="180" r="12" fill="${base}"/>
  <circle cx="138" cy="180" r="12" fill="${base}"/>`

// Icono normal: el carrito centrado sobre el verde de la marca.
const svgIcono = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="${VERDE}"/>
  <g transform="translate(56,34) scale(2)">${carrito(CREMA)}</g>
</svg>`

// Icono "maskable": Android recorta los bordes, así que el dibujo va más
// chico y centrado para que no se coma las ruedas ni el techo.
const svgMaskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${VERDE}"/>
  <g transform="translate(106,90) scale(1.5)">${carrito(CREMA)}</g>
</svg>`

const salidas = [
  { nombre: 'pwa-192.png', tamano: 192, svg: svgIcono },
  { nombre: 'pwa-512.png', tamano: 512, svg: svgIcono },
  { nombre: 'pwa-maskable-512.png', tamano: 512, svg: svgMaskable },
  { nombre: 'apple-touch-icon.png', tamano: 180, svg: svgIcono },
]

await mkdir('public', { recursive: true })

for (const { nombre, tamano, svg } of salidas) {
  const png = await sharp(Buffer.from(svg)).resize(tamano, tamano).png().toBuffer()
  await writeFile(`public/${nombre}`, png)
  console.log(`generado public/${nombre} (${tamano}x${tamano})`)
}

await writeFile('public/caserita.svg', svgIcono)
console.log('generado public/caserita.svg')

// El símbolo suelto (sin fondo), para usarlo dentro de la interfaz.
const svgSimbolo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <g>${carrito(VERDE)}</g>
</svg>`
await writeFile('public/carrito.svg', svgSimbolo)
console.log('generado public/carrito.svg')
