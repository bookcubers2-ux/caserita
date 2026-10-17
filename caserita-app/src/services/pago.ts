import type { EstadoPago } from '../types'

/**
 * Cómo se cobra hoy en Caserita (mientras no exista la cuenta de comercio
 * con el banco que emita un QR por cada venta):
 *
 *   1. el vecino ve el QR de cobro de Caserita (public/qr-cobro.png: es el
 *      QR de la cuenta bancaria de Caserita, el mismo para todos) y el monto;
 *   2. paga desde su app bancaria y sube la captura del comprobante;
 *   3. la captura llega a Telegram y la aceptamos o rechazamos a mano;
 *   4. la app consulta cada pocos segundos y muestra el resultado.
 *
 * Cuando exista el convenio, el QR por venta reemplaza a la imagen fija y el
 * webhook del banco reemplaza al botón de Telegram. El resto no cambia.
 */

/** Imagen del QR de cobro. Reemplazar el archivo por el QR real de la cuenta de Caserita. */
export const QR_COBRO_URL = '/qr-cobro.png'

/** Cada cuánto consulta la app si el pago ya fue verificado. */
export const INTERVALO_SONDEO_MS = 5000

export const ETIQUETA_ESTADO: Record<EstadoPago, string> = {
  pendiente: 'Por pagar',
  verificando: 'Revisando tu pago',
  pagado: 'Pago confirmado',
  rechazado: 'Comprobante rechazado',
}

/** Lo que el vecino escribe como glosa al pagar, para que la encontremos rápido. */
export function glosaDePago(codigo: string): string {
  return `CASERITA ${codigo}`
}
