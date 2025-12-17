/**
 * Utilidades para conversión de grados
 */

/**
 * Convierte un grado numérico a su representación textual
 * @param grado - Número del grado (preescolar: -3 a -1, primaria: 1-6, secundaria: 7-9, bachillerato: 10-12)
 * @returns String con la representación textual del grado
 */
export function getGradoTexto(grado: number): string {
  if (grado >= -3 && grado <= -1) {
    const gradoPreescolar = 4 + grado
    return `${gradoPreescolar}° de Preescolar`
  } else if (grado >= 1 && grado <= 6) {
    return `${grado}° de Primaria`
  } else if (grado >= 7 && grado <= 9) {
    const gradoSecundaria = grado - 6
    return `${gradoSecundaria}° de Secundaria`
  } else if (grado >= 10 && grado <= 12) {
    const gradoBachillerato = grado - 9
    return `${gradoBachillerato}° de Bachillerato`
  }
  return `${grado}° Grado`
}

/**
 * Convierte un grado numérico a su representación corta
 * @param grado - Número del grado (preescolar: -3 a -1, primaria: 1-6, secundaria: 7-9, bachillerato: 10-12)
 * @returns String con la representación corta del grado
 */
export function getGradoCorto(grado: number): string {
  if (grado >= -3 && grado <= -1) {
    const gradoPreescolar = 4 + grado
    return `Pre ${gradoPreescolar}°`
  } else if (grado >= 1 && grado <= 6) {
    return `${grado}° Prim`
  } else if (grado >= 7 && grado <= 9) {
    const gradoSecundaria = grado - 6
    return `${gradoSecundaria}° Sec`
  } else if (grado >= 10 && grado <= 12) {
    const gradoBachillerato = grado - 9
    return `${gradoBachillerato}° Bach`
  }
  return `${grado}°`
}
