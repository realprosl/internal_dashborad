import { For, createSignal, createMemo } from "solid-js";
import { useTheme } from "../contexts/ThemeContext";
import { useAppStore } from "../store";
import {
  CloseIcon,
  CalendarIcon,
} from "../components/Icons";
import DailyAssignmentModal from "../components/DailyAssignmentModal";
import {
  createSortHandler,
  createSortIconComponent,
  createFilterAndSort,
  type SortDirection,
} from "../utils";
import type { Planing } from "../types";

type SortField = keyof Planing;

export default function PlaningPage() {
  const { theme } = useTheme();
  const store = useAppStore();

  // States
  const [search, setSearch] = createSignal("");
  const [sortField, setSortField] = createSignal<SortField>("id");
  const [sortDirection, setSortDirection] = createSignal<SortDirection>("asc");
  const [showModal, setShowModal] = createSignal(false);
  const [showDailyAssignmentModal, setShowDailyAssignmentModal] =
    createSignal(false);
  const [editingId, setEditingId] = createSignal<number | null>(null);
  const [formData, setFormData] = createSignal({
    fecha: new Date().toISOString().split("T")[0],
    operario_id: 0,
    obra_id: 0,
  });

  // Computed
  const filteredAndSorted = createMemo(() => {
    return createFilterAndSort({
      data: store.planings || [],
      searchTerm: search(),
      sortField: sortField(),
      sortDirection: sortDirection(),
      getSortValue: (item: Planing, field: keyof Planing) => {
        if (field === "fecha") {
          return new Date(item.fecha).getTime();
        }
        const value = item[field];
        if (typeof value === "string") {
          return value.toLowerCase();
        }
        return value;
      },
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
    const planing = store.planings.find((p) => p.id === id);
    if (planing) {
      setEditingId(id);
      setFormData({
        fecha: planing.fecha.split("T")[0],
        operario_id: planing.operario_id,
        obra_id: planing.obra_id,
      });
      setShowModal(true);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Eliminar este planing?")) {
      store.deletePlaning(id);
    }
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData({
      fecha: new Date().toISOString().split("T")[0],
      operario_id: 0,
      obra_id: 0,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const data = formData();
    const id = editingId();

    try {
      if (id) {
        // Para edición
        await store.updatePlaning(id, {
          fecha: data.fecha,
          operario_id: data.operario_id,
          obra_id: data.obra_id,
        });
      } else {
        // Para creación
        const planingData = {
          fecha: data.fecha,
          operario_id: data.operario_id,
          obra_id: data.obra_id,
        };
        await store.addPlaning(planingData);
      }
      setShowModal(false);
      setEditingId(null);
    } catch (error) {
      // El error ya está manejado en el store
      console.error(error);
    }
  };

  const handleBatchSave = async (
    fecha: string,
    operations: {
      type: "add" | "remove";
      obra_id: number;
      operario_id: number;
    }[],
  ) => {
    try {
      const response = await fetch("/api/planings/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha, operations }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      // Recargar la lista de planings para reflejar los cambios
      await store.fetchPlanings();
      setShowDailyAssignmentModal(false);
    } catch (err: any) {
      throw err; // Re-lanzar para que el modal lo maneje
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
          <CalendarIcon class="text-blue-600 dark:text-blue-400" />
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            Planing
          </h1>
        </div>
        <div class="flex space-x-3">
          <button
            onClick={handleCreate}
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Nuevo Planing
          </button>
          <button
            onClick={() => setShowDailyAssignmentModal(true)}
            class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            Asignación Diaria
          </button>
        </div>
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

        {/* Modal de Asignación Diaria */}
        <DailyAssignmentModal
          show={showDailyAssignmentModal()}
          onClose={() => setShowDailyAssignmentModal(false)}
          onSave={handleBatchSave}
        />
      </div>
      {store.loading && (
        <div class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            Cargando planings...
          </p>
        </div>
      )}
      {store.error && (
        <div class="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg mb-4">
          <p class="text-red-800 dark:text-red-200">
            Error al cargar planings: {store.error}
          </p>
        </div>
      )}
      {!store.loading && !store.error && (
        <div class="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
          {/* Header */}
          <div
            class={`grid grid-cols-4 gap-3 px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 ${theme() === "dark" ? "bg-gray-800" : "bg-gray-100"} border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10`}
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
              onClick={() => handleSort("fecha")}
            >
              <span>Fecha</span>
              {SortIconComponent("fecha")}
            </div>
            <div
              class="cursor-pointer flex items-center justify-center"
              onClick={() => handleSort("operario_nombre")}
            >
              <span>Operario</span>
              {SortIconComponent("operario_nombre")}
            </div>
            <div
              class="cursor-pointer flex items-center justify-center"
              onClick={() => handleSort("obra_nombre")}
            >
              <span>Obra</span>
              {SortIconComponent("obra_nombre")}
            </div>
          </div>
          {/* Body with scroll */}
          <div class="max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
            <For each={filteredAndSorted()}>
              {(planing) => (
                <div
                  class="grid grid-cols-4 gap-3 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer items-center text-center"
                  onClick={(e) => {
                    e.preventDefault();
                    handleEdit(planing.id);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleDelete(planing.id);
                  }}
                >
                  <div class="flex items-center justify-center text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    {planing.id}
                  </div>
                  <div class="flex items-center justify-center text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    {new Date(planing.fecha).toLocaleDateString()}
                  </div>
                  <div class="flex items-center justify-center text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    {planing.operario_nombre}
                  </div>
                  <div class="flex items-center justify-center text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    {planing.obra_nombre}
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
                {editingId() ? "Editar Planing" : "Nuevo Planing"}
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
                  Fecha
                </label>
                <input
                  type="date"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={formData().fecha}
                  onInput={(e) =>
                    handleInputChange("fecha", e.currentTarget.value)
                  }
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Operario
                </label>
                <select
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={formData().operario_id}
                  onChange={(e) =>
                    handleInputChange(
                      "operario_id",
                      parseInt(e.currentTarget.value),
                    )
                  }
                >
                  <option value="0">Seleccionar operario</option>
                  {store.operarios.map((op) => (
                    <option value={op.id}>{op.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Obra
                </label>
                <select
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={formData().obra_id}
                  onChange={(e) =>
                    handleInputChange(
                      "obra_id",
                      parseInt(e.currentTarget.value),
                    )
                  }
                >
                  <option value="0">Seleccionar obra</option>
                  {store.obras.map((ob) => (
                    <option value={ob.id}>{ob.nombre}</option>
                  ))}
                </select>
              </div>
              <div class="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
