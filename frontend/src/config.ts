/**
 * Configuración global del frontend.
 *
 * API_BASE: prefijo que se concatena a todas las rutas /api/*.
 *
 *   - Vacío ("") → las llamadas se hacen a "/api/...". En dev el proxy de
 *     Vite (vite.config.ts) las redirige al backend local. En producción,
 *     sirve el frontend desde el mismo origen que la API.
 *
 *   - URL absoluta (ej. "http://192.168.1.20:8080") → el frontend hace
 *     llamadas cross-origin al servidor indicado. Útil cuando ejecutas
 *     el frontend en tu máquina y el backend está en otro equipo.
 *
 * Se controla con la variable de entorno VITE_API_URL en un archivo .env.local.
 * Ver .env.example.
 */

export const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "";

export const apiUrl = (path: string): string => `${API_BASE}${path}`;