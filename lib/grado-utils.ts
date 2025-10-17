/**
 * Utilidades para conversión de grados
 */

/**
 * Convierte un grado numérico a su representación textual
 * @param grado - Número del grado (1-12)
 * @returns String con la representación textual del grado
 */
export function getGradoTexto(grado: number): string {
  if (grado >= 1 && grado <= 6) {
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
 * @param grado - Número del grado (1-12)
 * @returns String con la representación corta del grado
 */
export function getGradoCorto(grado: number): string {
  if (grado >= 1 && grado <= 6) {
    return `${grado}° Primaria`
  } else if (grado >= 7 && grado <= 9) {
    const gradoSecundaria = grado - 6
    return `${gradoSecundaria}° Secundaria`
  } else if (grado >= 10 && grado <= 12) {
    const gradoBachillerato = grado - 9
    return `${gradoBachillerato}° Bachillerato`
  }
  return `${grado}° Grado`
}
