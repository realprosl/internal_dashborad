import { For, createSignal, createMemo, createEffect } from "solid-js";
import { useTheme } from "../contexts/ThemeContext";
import { useAppStore } from "../store";
import {
  CloseIcon,
} from "../components/Icons";
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
import type { Material } from "../types";

type SortField = keyof Material;

export default function MaterialesPage() {
  const { theme } = useTheme();
  const store = useAppStore();

  // Cargar materiales al montar la página si no hay datos o hay error
  createEffect(() => {
    if (store.materiales.length === 0 || store.error) {
      store.fetchMateriales();
    }
  });

  // Debug: log when store.materiales changes
  createEffect(() => {
    console.log("store.materiales changed, length:", store.materiales.length, "items:", store.materiales);
  });

  // States
  const [search, setSearch] = createSignal("");
  const [sortField, setSortField] = createSignal<SortField>("fecha");
  const [sortDirection, setSortDirection] = createSignal<SortDirection>("asc");
  const [showModal, setShowModal] = createSignal(false);
  const [editingId, setEditingId] = createSignal<number | null>(null);
  const [formData, setFormData] = createSignal({
    id: "",
    fecha: "",
    obra_id: "",
    descripcion: "",
    precio: 0,
    unidad: "",
    unidades: 0,
    estado: "pedido",
  });
  const [precioText, setPrecioText] = createSignal("0,00");
  const [unidadesText, setUnidadesText] = createSignal("0,00");
  const [notification, setNotification] = createSignal<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);


  // Computed
  const filteredAndSorted = createMemo(() => {
    console.log("filteredAndSorted recomputing, materiales count:", store.materiales.length);
    // Aplicar búsqueda y ordenamiento
    return createFilterAndSort({
      data: store.materiales,
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
    console.log("handleEdit called with id:", id);
    const material = store.materiales.find((m) => m.id === id);
    console.log("Found material:", material);
    if (material) {
      setEditingId(id);
      setFormData({
        id: "",
        fecha: material.fecha,
        obra_id: material.obra_id.toString(),
        descripcion: material.descripcion,
        precio: material.precio,
        unidad: material.unidad,
        unidades: material.unidades,
        estado: material.estado,
      });
      setPrecioText(formatSpanishFloat(material.precio));
      setUnidadesText(formatSpanishFloat(material.unidades));
      setShowModal(true);
      console.log("Modal should be open now");
    } else {
      console.log("Material not found in store");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Eliminar este material?")) {
      try {
        await store.deleteMaterial(id);
        setNotification({
          message: "Material eliminado correctamente",
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
      fecha: "",
      obra_id: "",
      descripcion: "",
      precio: 0,
      unidad: "",
      unidades: 0,
      estado: "pedido"
    });
    setPrecioText("0,00");
    setUnidadesText("0,00");
    setShowModal(true);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const data = formData();
    const id = editingId();

    try {
      if (id) {
        // Para edición
        console.log("Updating material with ID:", id, "data:", data);
        const result = await store.updateMaterial(id, {
          fecha: data.fecha,
          obra_id: parseInt(data.obra_id) || 0,
          descripcion: data.descripcion,
          precio: data.precio,
          unidad: data.unidad,
          unidades: data.unidades,
          estado: data.estado,
        });
        console.log("Update result:", result);
        console.log("Store materiales after update:", store.materiales);
        setNotification({
          message: "Material actualizado correctamente",
          type: "success",
        });
      } else {
        // Para creación - solo enviar si hay ID explícito
        const materialData: any = {
          fecha: data.fecha,
          obra_id: parseInt(data.obra_id) || 0,
          descripcion: data.descripcion,
          precio: data.precio,
          unidad: data.unidad,
          unidades: data.unidades,
          estado: data.estado,
        };

        // Solo incluir ID si se proporcionó explícitamente
        if (data.id && data.id.trim() !== "") {
          const parsedId = parseInt(data.id);
          if (!isNaN(parsedId) && parsedId > 0) {
            materialData.id = parsedId;
          }
        }

        console.log("Creating material with data:", materialData);
        const result = await store.addMaterial(materialData);
        console.log("Create result:", result);
        console.log("Store materiales after create:", store.materiales);
        setNotification({
          message: "Material creado correctamente",
          type: "success",
        });
      }

      setShowModal(false);
      setEditingId(null);
    } catch (error) {
      console.error("Error en handleSubmit:", error);
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
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            Materiales
          </h1>
        </div>
        <button
          onClick={handleCreate}
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          Nuevo Material
        </button>
      </div>
      <div class="mb-6 flex flex-col sm:flex-row gap-4">
        <div class="relative flex-grow">
          <input
            type="text"
            placeholder="Buscar por descripción..."
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
      </div>
      {store.loading && (
        <div class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="mt-2 text-gray-600 dark:text-gray-400">Cargando materiales...</p>
        </div>
      )}
      {store.error && (
        <div class="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg mb-4">
          <p class="text-red-800 dark:text-red-200">
            Error al cargar materiales: {store.error}
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
              onClick={() => handleSort("fecha")}
            >
              <span>Fecha</span>
              {SortIconComponent("fecha")}
            </div>
            <div
              class="cursor-pointer flex items-center justify-center"
              onClick={() => handleSort("obra_nombre")}
            >
              <span>Obra</span>
              {SortIconComponent("obra_nombre")}
            </div>
            <div
              class="cursor-pointer flex items-center justify-center"
              onClick={() => handleSort("descripcion")}
            >
              <span>Descripción</span>
              {SortIconComponent("descripcion")}
            </div>
            <div class="flex items-center justify-center">
              <span>Total (€)</span>
            </div>
            <div
              class="cursor-pointer flex items-center justify-center"
              onClick={() => handleSort("estado")}
            >
              <span>Estado</span>
              {SortIconComponent("estado")}
            </div>
          </div>
          {/* Body with scroll */}
          <div class="max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
            <For each={filteredAndSorted()}>
              {(material) => {
                const total = material.precio * material.unidades;
                const estadoConfig = {
                  pedido: { label: "Pedido", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
                  espera: { label: "En espera", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
                  entregado: { label: "Entregado", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" }
                };
                const estado = estadoConfig[material.estado as keyof typeof estadoConfig] || estadoConfig.pedido;

                return (
                  <div
                    class="grid grid-cols-5 text-center gap-3 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer items-center"
                    onClick={(e) => {
                      e.preventDefault();
                      handleEdit(material.id);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      handleDelete(material.id);
                    }}
                  >
                    <div class="flex items-center justify-center text-sm text-gray-900 dark:text-white whitespace-nowrap">
                      {material.fecha}
                    </div>
                    <div class="flex items-center justify-center text-sm text-gray-900 dark:text-white whitespace-nowrap">
                      {material.obra_nombre || `Obra ${material.obra_id}`}
                    </div>
                    <div class="flex items-center justify-center text-sm text-gray-900 dark:text-white whitespace-nowrap">
                      {material.descripcion}
                    </div>
                    <div class="flex items-center justify-center text-sm text-gray-900 dark:text-white whitespace-nowrap">
                      {formatSpanishFloat(total)}€
                      <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">
                        ({formatSpanishFloat(material.precio)}€ × {formatSpanishFloat(material.unidades)} {material.unidad})
                      </span>
                    </div>
                    <div class="flex items-center justify-center whitespace-nowrap">
                      <span
                        class={`px-2 py-1 text-xs font-medium rounded-full ${estado.color} pointer-events-none`}
                      >
                        {estado.label}
                      </span>
                    </div>
                  </div>
                );
              }}
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
                {editingId() ? "Editar Material" : "Nuevo Material"}
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
                  onChange={(e) =>
                    handleInputChange("fecha", e.currentTarget.value)
                  }
                />
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
                    handleInputChange("obra_id", e.currentTarget.value)
                  }
                >
                  <option value="">Seleccionar obra</option>
                  <For each={store.obras}>
                    {(obra) => (
                      <option value={obra.id}>{obra.id} - {obra.nombre}</option>
                    )}
                  </For>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={formData().descripcion}
                  onInput={(e) =>
                    handleInputChange("descripcion", e.currentTarget.value)
                  }
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Precio y Unidad
                </label>
                <div class="flex gap-2">
                  <div class="flex-grow">
                    <input
                      type="text"
                      inputmode="decimal"
                      required
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={precioText()}
                      onInput={(e) => {
                        const value = e.currentTarget.value;
                        const cleaned = cleanNumericInput(value);
                        setPrecioText(cleaned);

                        // Convertir a número y actualizar formData
                        const numValue = parseSpanishFloat(cleaned);
                        handleInputChange("precio", numValue);
                      }}
                      placeholder="Precio unidad (€)"
                    />
                  </div>
                  <div class="w-24">
                    <input
                      type="text"
                      required
                      maxlength="3"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                      value={formData().unidad}
                      onInput={(e) =>
                        handleInputChange("unidad", e.currentTarget.value)
                      }
                      placeholder="kg, m, ud"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cantidad
                </label>
                <input
                  type="text"
                  inputmode="decimal"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={unidadesText()}
                  onInput={(e) => {
                    const value = e.currentTarget.value;
                    const cleaned = cleanNumericInput(value);
                    setUnidadesText(cleaned);

                    // Convertir a número y actualizar formData
                    const numValue = parseSpanishFloat(cleaned);
                    handleInputChange("unidades", numValue);
                  }}
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado
                </label>
                <select
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={formData().estado}
                  onChange={(e) =>
                    handleInputChange("estado", e.currentTarget.value)
                  }
                >
                  <option value="pedido">Pedido</option>
                  <option value="espera">En espera</option>
                  <option value="entregado">Entregado</option>
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
                  {editingId() ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
