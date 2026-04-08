import { For, createSignal, createMemo } from "solid-js";
import { useTheme } from "../contexts/ThemeContext";
import { useAppStore } from "../store";
import {
  CloseIcon,
  PersonIcon,
} from "../components/Icons";
import {
  createSortHandler,
  createSortIconComponent,
  createFilterAndSort,
  type SortDirection,
  parseSpanishFloat,
  formatSpanishFloat,
  cleanNumericInput,
} from "../utils";
import type { Operario } from "../types";

type SortField = keyof Operario;

export default function OperariosPage() {
  const { theme } = useTheme();
  const store = useAppStore();

  // States
  const [search, setSearch] = createSignal("");
  const [sortField, setSortField] = createSignal<SortField>("id");
  const [sortDirection, setSortDirection] = createSignal<SortDirection>("asc");
  const [showModal, setShowModal] = createSignal(false);
  const [editingId, setEditingId] = createSignal<number | null>(null);
  const [formData, setFormData] = createSignal({
    nombre: "",
    gasto_diario: 0,
  });
  const [gastoDiarioText, setGastoDiarioText] = createSignal("0,00");

  // Computed
  const filteredAndSorted = createMemo(() => {
    return createFilterAndSort({
      data: store.operarios,
      searchTerm: search(),
      sortField: sortField(),
      sortDirection: sortDirection(),
    });
  });

  // Handlers
  const handleSort = createSortHandler(
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
  );

  const SortIconComponent = createSortIconComponent(sortField, sortDirection);

  const handleEdit = (id: number) => {
    const operario = store.operarios.find((o) => o.id === id);
    if (operario) {
      setEditingId(id);
      setFormData({
        nombre: operario.nombre,
        gasto_diario: operario.gasto_diario,
      });
      setGastoDiarioText(formatSpanishFloat(operario.gasto_diario));
      setShowModal(true);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Eliminar este operario?")) {
      store.deleteOperario(id);
    }
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData({ nombre: "", gasto_diario: 0 });
    setGastoDiarioText("0,00");
    setShowModal(true);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const data = formData();
    const id = editingId();

    try {
      if (id) {
        // Para edición
        await store.updateOperario(id, {
          nombre: data.nombre,
          gasto_diario: data.gasto_diario,
        });
      } else {
        // Para creación
        const operarioData = {
          nombre: data.nombre,
          gasto_diario: data.gasto_diario,
        };
        await store.addOperario(operarioData);
      }
      setShowModal(false);
      setEditingId(null);
    } catch (error) {
      // El error ya está manejado en el store
      console.error(error);
    }
  };

  const handleInputChange = (
    field: keyof ReturnType<typeof formData>,
    value: any,
  ) => {
    setFormData({ ...formData(), [field]: value });
  };

  return (
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center space-x-3">
          <PersonIcon class="text-blue-600 dark:text-blue-400" />
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            Operarios
          </h1>
        </div>
        <button
          onClick={handleCreate}
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          Nuevo Operario
        </button>
      </div>
      <div class="mb-6 relative">
        <input
          type="text"
          placeholder="Buscar..."
          class="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
        />
        {search() && (
          <button
            type="button"
            onClick={() => setSearch("")}
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            aria-label="Limpiar búsqueda"
          >
            <CloseIcon class="w-4 h-4" />
          </button>
        )}
      </div>
      {store.loading && (
        <div class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            Cargando operarios...
          </p>
        </div>
      )}
      {store.error && (
        <div class="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg mb-4">
          <p class="text-red-800 dark:text-red-200">
            Error al cargar operarios: {store.error}
          </p>
        </div>
      )}
      {!store.loading && !store.error && (
        <div class="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
          {/* Header */}
          <div
            class={`grid grid-cols-3 gap-3 px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 ${theme() === "dark" ? "bg-gray-800" : "bg-gray-100"} border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10`}
          >
            <div
              class="cursor-pointer flex items-center justify-center"
              onClick={() => handleSort("id")}
            >
              <span>ID</span>
              {SortIconComponent("id")}
            </div>
            <div
              class="cursor-pointer flex items-center justify-center"
              onClick={() => handleSort("nombre")}
            >
              <span>Nombre</span>
              {SortIconComponent("nombre")}
            </div>
            <div
              class="cursor-pointer flex items-center justify-center"
              onClick={() => handleSort("gasto_diario")}
            >
              <span>Gasto Diario (€)</span>
              {SortIconComponent("gasto_diario")}
            </div>
          </div>
          {/* Body with scroll */}
          <div class="max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
            <For each={filteredAndSorted()}>
              {(operario) => (
                <div
                  class="grid grid-cols-3 gap-3 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer items-center text-center"
                  onClick={(e) => {
                    e.preventDefault();
                    handleEdit(operario.id);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleDelete(operario.id);
                  }}
                >
                  <div class="flex items-center justify-center text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    {operario.id}
                  </div>
                  <div class="flex items-center justify-center text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    {operario.nombre}
                  </div>
                  <div class="flex items-center justify-center text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    {formatSpanishFloat(operario.gasto_diario)}€
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal() && (
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div class="flex justify-between items-center p-6 border-b dark:border-gray-700">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                {editingId() ? "Editar Operario" : "Nuevo Operario"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={handleSubmit} class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={formData().nombre}
                  onInput={(e) =>
                    handleInputChange("nombre", e.currentTarget.value)
                  }
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Gasto Diario (€)
                </label>
                <input
                  type="text"
                  inputmode="decimal"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={gastoDiarioText()}
                  onInput={(e) => {
                    const value = e.currentTarget.value;
                    const cleaned = cleanNumericInput(value);
                    setGastoDiarioText(cleaned);

                    // Convertir a número y actualizar formData
                    const numValue = parseSpanishFloat(cleaned);
                    handleInputChange("gasto_diario", numValue);
                  }}
                />
              </div>
              {store.error && (
                <div class="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <p class="text-sm text-red-800 dark:text-red-200">
                    {store.error}
                  </p>
                </div>
              )}
              <div class="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  disabled={store.loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={store.loading}
                >
                  {store.loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
