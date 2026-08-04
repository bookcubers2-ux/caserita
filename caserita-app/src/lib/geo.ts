/** Distancia en linea recta entre dos coordenadas, en kilometros (haversine). */
export function distanciaKm(
  [lat1, lon1]: [number, number],
  [lat2, lon2]: [number, number],
): number {
  const R = 6371
  const rad = (g: number) => (g * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLon = rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/**
 * Distancia aproximada caminando o en moto. La linea recta siempre subestima
 * el recorrido real por calles; en una ciudad de damero como Santa Cruz el
 * factor tipico ronda 1.25.
 */
export function distanciaPorCalle(a: [number, number], b: [number, number]): number {
  return Math.round(distanciaKm(a, b) * 1.25 * 10) / 10
}
