import { Show } from "solid-js";
import { BuildingIcon, GoogleIcon } from "../components/Icons";
import { useAppStore } from "../store";

/**
 * Página standalone (sin Layout) que ofrece el botón "Sign in with Google".
 * Usa ruta relativa para el redirect → en dev pasa por el proxy de Vite,
 * manteniendo same-origin y SameSite=Lax funcionales.
 */
export default function LoginPage() {
  const store = useAppStore();

  const handleLogin = () => {
    store.login();
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
        <div class="flex flex-col items-center space-y-3">
          <BuildingIcon class="text-blue-600 dark:text-blue-400 w-12 h-12" />
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            ProApp
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 text-center">
            Inicia sesión con tu cuenta de Google para acceder
          </p>
        </div>

        <button
          onClick={handleLogin}
          class="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        >
          <GoogleIcon class="w-5 h-5" />
          <span class="font-medium">Sign in with Google</span>
        </button>

        <Show when={store.error}>
          <div class="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p class="text-sm text-red-800 dark:text-red-200">
              {store.error}
            </p>
          </div>
        </Show>
      </div>
    </div>
  );
}