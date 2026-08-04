/**
 * Genera los iconos PNG de la app instalable a partir de un SVG.
 * Uso: node scripts/generar-iconos.mjs
 */
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'

const VERDE = '#2f7d3a'

// Icono normal: la bolsa con el pin, sobre el verde de la marca.
const svgIcono = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="${VERDE}"/>
  <path d="M256 112c-62 0-112 48-112 112 0 76 112 176 112 176s112-100 112-176c0-64-50-112-112-112z" fill="#fff"/>
  <circle cx="256" cy="220" r="46" fill="${VERDE}"/>
</svg>`

// Icono "maskable": Android recorta los bordes, así que el dibujo va más
// chico y centrado para que no se coma el pin.
const svgMaskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${VERDE}"/>
  <path d="M256 156c-48 0-86 37-86 86 0 58 86 134 86 134s86-76 86-134c0-49-38-86-86-86z" fill="#fff"/>
  <circle cx="256" cy="238" r="35" fill="${VERDE}"/>
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
