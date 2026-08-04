import QRCode from 'qrcode'
import type { EstadoPago } from '../types'

/**
 * Pago con QR Simple.
 *
 * IMPORTANTE: un QR Simple con validez bancaria lo emite el banco adquirente
 * (ACH Bolivia / Banco Unión) contra una cuenta de comercio, y la confirmación
 * llega por webhook desde el banco. Mientras no exista ese convenio:
 *   1. el QR codifica una referencia de cobro en TEXTO PLANO, no una URL, para
 *      que nadie termine en un dominio que no existe al escanearlo;
 *   2. el cobro solo avanza cuando la persona declara que pagó. Nada se
 *      confirma solo: una pantalla que dice "pago recibido" sin que nadie
 *      haya pagado destruye la credibilidad de la demo.
 * Cuando exista la integración se reemplazan `construirPayload` (por el payload
 * EMVCo del banco) y `confirmarPago` (por el webhook real).
 */

export interface DatosCobro {
  codigo: string
  negocio: string
  monto: number
}

/** Texto plano legible: ninguna app lo confunde con un cobro bancario real. */
export function construirPayload({ codigo, negocio, monto }: DatosCobro): string {
  return [
    'CASERITA',
    'COBRO DE DEMOSTRACION',
    `Negocio: ${negocio}`,
    `Referencia: ${codigo}`,
    `Monto: BOB ${monto.toFixed(2)}`,
    'Sin convenio bancario: no genera un pago real.',
  ].join('\n')
}

/** Devuelve el QR como SVG (string) listo para inyectar. */
export async function generarQrSvg(datos: DatosCobro): Promise<string> {
  return QRCode.toString(construirPayload(datos), {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 220,
    color: { dark: '#1f2937', light: '#00000000' },
  })
}

export function nuevaReferencia(): string {
  return `TXN${Math.floor(Math.random() * 900000 + 100000)}`
}

/**
 * Acredita el cobro. Solo se llama cuando la persona declara que ya pagó.
 * Con backend real esto se cambia por la consulta al estado de la transacción.
 */
export async function confirmarPago(): Promise<{ referencia: string }> {
  await new Promise((r) => setTimeout(r, 1600))
  return { referencia: nuevaReferencia() }
}

export const ETIQUETA_ESTADO: Record<EstadoPago, string> = {
  pendiente: 'Pago pendiente',
  esperando: 'Esperando tu pago',
  procesando: 'Procesando en el banco',
  pagado: 'Pago confirmado',
  expirado: 'QR vencido',
}
