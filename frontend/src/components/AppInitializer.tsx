import { createEffect } from 'solid-js';
import { useAppStore } from '../store';

export default function AppInitializer() {
  const store = useAppStore();

  createEffect(() => {
    // Cargar todos los datos cuando el componente se monte
    store.fetchAll();
  });

  // Mostrar estado de carga global
  return (
    <>
      {store.loading && (
        <div class="fixed top-4 right-4 z-50 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg">
          Cargando datos...
        </div>
      )}
      {store.error && (
        <div class="fixed top-4 right-4 z-50 px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg">
          Error: {store.error}
        </div>
      )}
    </>
  );
}