/**
 * Convierte un string de número en formato español (con coma decimal) a número
 * Ejemplo: "12,34" -> 12.34
 */
export function parseSpanishFloat(value: string): number {
  if (!value || value.trim() === '') return 0;

  // Manejar múltiples comas (solo la última es decimal)
  const parts = value.split(',');
  if (parts.length > 2) {
    // Si hay más de una coma, unir todas excepto la última y usar la última como decimal
    const integerPart = parts.slice(0, -1).join('').replace(/\./g, '');
    const decimalPart = parts[parts.length - 1];
    const normalized = `${integerPart}.${decimalPart}`;
    const result = parseFloat(normalized);
    return isNaN(result) ? 0 : result;
  }

  // Reemplazar comas por puntos y eliminar espacios
  const normalized = value
    .replace(/\./g, '')  // Eliminar separadores de miles
    .replace(',', '.')   // Reemplazar coma decimal por punto
    .trim();

  const result = parseFloat(normalized);
  return isNaN(result) ? 0 : result;
}

/**
 * Formatea un número a string con formato español (coma decimal)
 * Ejemplo: 12.34 -> "12,34"
 */
export function formatSpanishFloat(value: number, decimals: number = 2): string {
  if (isNaN(value)) return "0,00";

  // Si el valor es entero, mostrar sin decimales
  if (Number.isInteger(value)) {
    return value.toLocaleString('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      useGrouping: false,
    });
  }

  return value.toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: false, // No usar separadores de miles
  });
}

/**
 * Maneja el cambio de input para campos numéricos con formato español
 */
export function handleNumericInputChange(
  value: string,
  onChange: (value: number) => void
): void {
  // Permitir solo números, comas y puntos
  const cleaned = value.replace(/[^\d,.-]/g, '');

  // Si el valor está vacío o solo tiene un signo negativo, usar 0
  if (!cleaned || cleaned === '-' || cleaned === ',' || cleaned === '.') {
    onChange(0);
    return;
  }

  // Convertir a número
  const numValue = parseSpanishFloat(cleaned);
  onChange(numValue);
}

/**
 * Limpia y formatea el texto de entrada para campos numéricos
 * Permite una mejor experiencia de usuario al escribir
 */
export function cleanNumericInput(text: string): string {
  // Permitir números, comas, puntos y signo negativo al inicio
  let cleaned = text.replace(/[^\d,.-]/g, '');

  // Solo permitir un signo negativo al inicio
  if (cleaned.startsWith('-')) {
    cleaned = '-' + cleaned.substring(1).replace(/-/g, '');
  } else {
    cleaned = cleaned.replace(/-/g, '');
  }

  // Solo permitir una coma o punto decimal
  const commaIndex = cleaned.indexOf(',');
  const dotIndex = cleaned.indexOf('.');

  if (commaIndex !== -1 && dotIndex !== -1) {
    // Si hay ambos, mantener solo el primero
    if (commaIndex < dotIndex) {
      cleaned = cleaned.substring(0, dotIndex) + cleaned.substring(dotIndex + 1);
    } else {
      cleaned = cleaned.substring(0, commaIndex) + cleaned.substring(commaIndex + 1);
    }
  }

  return cleaned;
}