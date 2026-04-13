import { For, createSignal, createMemo } from "solid-js";
import { useTheme } from "../contexts/ThemeContext";
import { useAppStore } from "../store";
import { CloseIcon, BuildingIcon } from "../components/Icons";
import Notification from "../components/Notification";
import {
  createSortHandler,
  createSortIconComponent,
  createFilterAndSort,
  type SortDirection,
  parseSpanishFloat,
  formatSpanishFloat,
  cleanNumericInput,
} from "../utils";
import type { Obra } from "../types";

import { GridTable } from "../components/GridTable";

type SortField = keyof Obra;

export default function ObrasPage() {
  const { theme } = useTheme();
  const store = useAppStore();

  // States
  const [search, setSearch] = createSignal("");
  const [estadoFilter, setEstadoFilter] = createSignal<string>("");
  const [sortField, setSortField] = createSignal<SortField>("id");
  const [sortDirection, setSortDirection] = createSignal<SortDirection>("asc");
  const [showModal, setShowModal] = createSignal(false);
  const [editingId, setEditingId] = createSignal<number | null>(null);
  const [formData, setFormData] = createSignal({
    id: "",
    nombre: "",
    valor_contrato: 0,
    estado: "activa",
    fecha_inicio: "",
  });
  const [valorContratoText, setValorContratoText] = createSignal("0,00");
  const [notification, setNotification] = createSignal<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Computed
  const filteredAndSorted = createMemo(() => {
    let filtered = store.obras;

    // Aplicar filtro por estado si está seleccionado
    const estado = estadoFilter();
    if (estado) {
      filtered = filtered.filter((obra) => obra.estado === estado);
    }

    // Aplicar búsqueda y ordenamiento
    return createFilterAndSort({
      data: filtered,
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
    const obra = store.obras.find((o) => o.id === id);
    if (obra) {
      setEditingId(id);
      setFormData({
        id: obra.id.toString(),
        nombre: obra.nombre,
        valor_contrato: obra.valor_contrato,
        estado: obra.estado,
        fecha_inicio: obra.fecha_inicio || "",
      });
      setValorContratoText(formatSpanishFloat(obra.valor_contrato));
      setShowModal(true);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Eliminar esta obra?")) {
      try {
        await store.deleteObra(id);
        setNotification({
          message: "Obra eliminada correctamente",
          type: "success",
        });
      } catch (error) {
        console.error(error);
        setNotification({
          message: `Error al eliminar: ${error instanceof Error ? error.message : "Error desconocido"}`,
          type: "error",
        });
      }
    }
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData({
      id: "",
      nombre: "",
      valor_contrato: 0,
      estado: "activa",
      fecha_inicio: "",
    });
    setValorContratoText("0,00");
    setShowModal(true);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const data = formData();
    const id = editingId();

    try {
      if (id) {
        // Para edición
        await store.updateObra(id, {
          nombre: data.nombre,
          valor_contrato: data.valor_contrato,
          estado: data.estado,
          fecha_inicio: data.fecha_inicio,
        });
        setNotification({
          message: "Obra actualizada correctamente",
          type: "success",
        });
      } else {
        // Para creación - solo enviar si hay ID explícito
        const obraData: any = {
          nombre: data.nombre,
          valor_contrato: data.valor_contrato,
          estado: data.estado,
          fecha_inicio: data.fecha_inicio,
        };

        // Solo incluir ID si se proporcionó explícitamente
        if (data.id && data.id.trim() !== "") {
          const parsedId = parseInt(data.id);
          if (!isNaN(parsedId) && parsedId > 0) {
            obraData.id = parsedId;
          }
        }

        await store.addObra(obraData);
        setNotification({
          message: "Obra creada correctamente",
          type: "success",
        });
      }
      setShowModal(false);
      setEditingId(null);
    } catch (error) {
      // El error ya está manejado en el store
      console.error(error);
      setNotification({
        message: `Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
        type: "error",
      });
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
          <BuildingIcon class="text-blue-600 dark:text-blue-400" />
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            Obras
          </h1>
        </div>
        <button
          onClick={handleCreate}
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          Nueva Obra
        </button>
      </div>
      <div class="mb-6 flex flex-col sm:flex-row gap-4">
        <div class="relative flex-grow">
          <input
            type="text"
            placeholder="Buscar por nombre..."
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
        <div class="w-full sm:w-48">
          <select
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={estadoFilter()}
            onChange={(e) => setEstadoFilter(e.currentTarget.value)}
          >
            <option value="">Todos los estados</option>
            <option value="activa">Activa</option>
            <option value="inactiva">Inactiva</option>
            <option value="terminada">Terminada</option>
          </select>
        </div>
      </div>
      {store.loading && (
        <div class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="mt-2 text-gray-600 dark:text-gray-400">Cargando obras...</p>
        </div>
      )}
      {store.error && (
        <div class="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg mb-4">
          <p class="text-red-800 dark:text-red-200">
            Error al cargar obras: {store.error}
          </p>
        </div>
      )}
      {!store.loading && !store.error && (
        <div class="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
          {/* Header */}
          <div
            class={`grid grid-cols-5 gap-3 px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 ${theme() === "dark" ? "bg-gray-800" : "bg-gray-100"} border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10`}
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
              onClick={() => handleSort("valor_contrato")}
            >
              <span>Valor Contrato (€)</span>
              {SortIconComponent("valor_contrato")}
            </div>
            <div
              class="cursor-pointer flex items-center justify-center"
              onClick={() => handleSort("estado")}
            >
              <span>Estado</span>
              {SortIconComponent("estado")}
            </div>
            <div
              class="cursor-pointer flex items-center justify-center"
              onClick={() => handleSort("fecha_inicio")}
            >
              <span>Fecha Inicio</span>
              {SortIconComponent("fecha_inicio")}
            </div>
          </div>
          {/* Body with scroll */}
          <div class="max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
            <For each={filteredAndSorted()}>
              {(obra) => (
                <div
                  class="grid grid-cols-5 text-center gap-3 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer items-center"
                  onClick={(e) => {
                    e.preventDefault();
                    handleEdit(obra.id);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleDelete(obra.id);
                  }}
                >
                  <div class="flex items-center justify-center text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    {obra.id}
                  </div>
                  <div class="flex items-center justify-center text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    {obra.nombre}
                  </div>
                  <div class="flex items-center justify-center text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    {formatSpanishFloat(obra.valor_contrato)}€
                  </div>
                  <div class="flex items-center justify-center whitespace-nowrap">
                    <span
                      class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        obra.estado === "activa"
                          ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                          : obra.estado === "inactiva"
                            ? "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                      }`}
                    >
                      {obra.estado}
                    </span>
                  </div>
                  <div class="flex items-center justify-center text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    {obra.fecha_inicio || "-"}
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      )}

      <GridTable
        data={store.obras}
        filter={search}
        gap={6}
        sortable={true}
        template="grid-cols-[3fr_1fr_4fr_1fr_1fr]"
        class="border border-gray-600 rounded-md"
        headerClass="bg-gray-800 rounded-md uppercase "
        rowClass="text-gray-300 text-center hover:bg-gray-800"
        headers={[
          { label: <div>Fecha</div>, key: "fecha_inicio" },
          { label: <div>ID</div>, key: "id" },
          { label: <div>Nombre</div>, key: "nombre" },
          { label: <div>Gasto</div>, key: "valor_contrato" },
          { label: <div>Estado</div>, key: "estado" },
        ]}
        rows={(row, index) => [
          <div>{row.fecha_inicio}</div>,
          <div>{row.id}</div>,
          <div class="text-left">{row.nombre}</div>,
          <div class="text-right">{row.valor_contrato}</div>,
          <div>{row.estado}</div>,
        ]}
      />

      {/* Modal */}
      {showModal() && (
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div class="flex justify-between items-center p-6 border-b dark:border-gray-700">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                {editingId() ? "Editar Obra" : "Nueva Obra"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={handleSubmit} class="p-6 space-y-4">
              {editingId() && (
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Id
                  </label>
                  <input
                    type="text"
                    required
                    disabled
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    value={formData().id}
                  />
                </div>
              )}
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
                  Valor Contrato (€)
                </label>
                <input
                  type="text"
                  inputmode="decimal"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={valorContratoText()}
                  onInput={(e) => {
                    const value = e.currentTarget.value;
                    const cleaned = cleanNumericInput(value);
                    setValorContratoText(cleaned);

                    // Convertir a número y actualizar formData
                    const numValue = parseSpanishFloat(cleaned);
                    handleInputChange("valor_contrato", numValue);
                  }}
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado
                </label>
                <select
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={formData().estado}
                  onChange={(e) =>
                    handleInputChange("estado", e.currentTarget.value)
                  }
                >
                  <option value="activa">Activa</option>
                  <option value="inactiva">Inactiva</option>
                  <option value="terminada">Terminada</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={formData().fecha_inicio}
                  onChange={(e) =>
                    handleInputChange("fecha_inicio", e.currentTarget.value)
                  }
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

      {/* Notifications */}
      {notification() && (
        <Notification
          message={notification()!.message}
          type={notification()!.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
