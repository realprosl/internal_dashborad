import { createEffect, Show } from "solid-js";
import { useNavigate, useLocation } from "@solidjs/router";
import { useAppStore } from "../store";

/**
 * Se ejecuta una vez al montar la app. Encargado de:
 *   1. Preguntar al backend si hay sesión (fetchCurrentUser).
 *   2. Si hay sesión, cargar los datos (fetchAll) — solo una vez.
 *   3. Guard: redirigir a /login si no hay sesión y no estamos ya en /login.
 *      Y al revés: si hay sesión y estamos en /login, ir a /.
 *
 * Renderiza overlays globales de loading/error (estilo anterior).
 */
export default function AppInitializer() {
  const store = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Carga inicial: verifica sesión una sola vez al montar.
  createEffect(() => {
    if (store.authLoading && store.currentUser === null) {
      store.fetchCurrentUser();
    }
  });

  // Tras resolver la sesión, dispara fetchAll (solo una vez).
  let didFetchAll = false;
  createEffect(() => {
    if (!store.authLoading && store.currentUser && !didFetchAll) {
      didFetchAll = true;
      store.fetchAll();
    }
  });

  // Guard: cuando sepamos si hay sesión, redirigimos si es necesario.
  createEffect(() => {
    if (store.authLoading) return; // aún no sabemos
    const path = location.pathname;
    if (!store.currentUser && path !== "/login") {
      navigate("/login", { replace: true });
    } else if (store.currentUser && path === "/login") {
      navigate("/", { replace: true });
    }
  });

  return (
    <>
      <Show when={store.loading}>
        <div class="fixed top-4 right-4 z-50 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg">
          Cargando datos...
        </div>
      </Show>
      <Show when={store.error}>
        <div class="fixed top-4 right-4 z-50 px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg max-w-md">
          <div class="font-semibold">Error</div>
          <div class="text-sm">{store.error}</div>
        </div>
      </Show>
    </>
  );
}