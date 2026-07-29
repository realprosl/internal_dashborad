/**
 * Configuración global del frontend.
 *
 * API_BASE: prefijo que se concatena a todas las rutas /api/* y /auth/*.
 *
 *   - Vacío ("") → las llamadas se hacen a "/api/..." y "/auth/...". En dev
 *     el proxy de Vite (vite.config.ts) las redirige al backend local. En
 *     producción, el backend sirve el frontend desde el mismo origen.
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

/**
 * Error thrown by apiFetch when the server returns non-2xx. Carries the
 * HTTP status so callers can distinguish 401 (session expired → login) from
 * 403 (forbidden → mostrar error) without parsing the message.
 */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Centralized wrapper for all backend HTTP calls. Guarantees:
 *   - credentials: 'include' (cookie de sesión viaja siempre)
 *   - lanza ApiError con .status en respuestas no-2xx
 *   - parsea JSON automáticamente
 *
 * Use este en lugar de `fetch()` directamente para que un fetch sin
 * credenciales (bug) sea imposible por construcción.
 */
export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestInit = {},
): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...opts,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(opts.headers ?? {}),
    },
  });

  // 204 No Content u otro sin body
  if (res.status === 204) return undefined as T;

  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const msg =
      body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : `HTTP ${res.status}`;
    throw new ApiError(msg, res.status);
  }

  return body as T;
}