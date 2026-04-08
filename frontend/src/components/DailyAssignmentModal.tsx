import {
  createSignal,
  createResource,
  createEffect,
  For,
  Show,
} from "solid-js";
import { CloseIcon } from "./Icons";
import type { Obra, Operario } from "../types";

type Assignment = {
  obra_id: number;
  operario_id: number;
};

type BatchOperation = {
  type: "add" | "remove";
  obra_id: number;
  operario_id: number;
};

interface DailyAssignmentModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (fecha: string, operations: BatchOperation[]) => Promise<void>;
}

// Fetch obras activas (estado = 'activa')
async function fetchObrasActivas(): Promise<Obra[]> {
  const response = await fetch("/api/obras?estado=activa");
  if (!response.ok) throw new Error("Failed to fetch obras activas");
  return response.json();
}

// Fetch todos los operarios
async function fetchOperarios(): Promise<Operario[]> {
  const response = await fetch("/api/operarios");
  if (!response.ok) throw new Error("Failed to fetch operarios");
  return response.json();
}

// Fetch asignaciones para una fecha específica
async function fetchAssignmentsByDate(fecha: string): Promise<Assignment[]> {
  const response = await fetch(`/api/planings/date/${fecha}`);
  if (!response.ok) {
    if (response.status === 404) {
      // No hay asignaciones para esta fecha, devolver array vacío
      return [];
    }
    throw new Error("Failed to fetch assignments");
  }
  return response.json();
}

export default function DailyAssignmentModal(props: DailyAssignmentModalProps) {
  const [selectedDate, setSelectedDate] = createSignal(
    new Date().toISOString().split("T")[0],
  );
  const [obrasActivas, { refetch: _refetchObras }] =
    createResource(fetchObrasActivas);
  const [operarios, { refetch: _refetchOperarios }] =
    createResource(fetchOperarios);
  const [assignments, { refetch: refetchAssignments }] = createResource(
    () => selectedDate(),
    fetchAssignmentsByDate,
  );
  const [assignmentsMap, setAssignmentsMap] = createSignal<
    Map<string, boolean>
  >(new Map());
  const [pendingChanges, setPendingChanges] = createSignal<BatchOperation[]>(
    [],
  );
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Actualizar el mapa de asignaciones cuando cambian los assignments
  createEffect(() => {
    const assigns = assignments();
    const map = new Map<string, boolean>();
    if (assigns) {
      assigns.forEach((a) => {
        map.set(`${a.obra_id}-${a.operario_id}`, true);
      });
    }
    setAssignmentsMap(map);
  });

  const isAssigned = (obraId: number, operarioId: number): boolean => {
    const key = `${obraId}-${operarioId}`;
    // Primero verificar cambios pendientes
    const pendingOps = pendingChanges();
    for (const op of pendingOps) {
      if (op.obra_id === obraId && op.operario_id === operarioId) {
        return op.type === "add"; // Si es add, está asignado; si es remove, no
      }
    }
    // Si no hay cambios pendientes, usar el estado actual
    return assignmentsMap().get(key) || false;
  };

  const toggleAssignment = (obraId: number, operarioId: number) => {
    const currentlyAssigned = isAssigned(obraId, operarioId);

    // Crear nueva operación
    const newOp: BatchOperation = {
      type: currentlyAssigned ? "remove" : "add",
      obra_id: obraId,
      operario_id: operarioId,
    };

    // Añadir a pendingChanges, eliminando cualquier operación previa para la misma celda
    setPendingChanges((prev) => {
      const filtered = prev.filter(
        (op) => !(op.obra_id === obraId && op.operario_id === operarioId),
      );
      return [...filtered, newOp];
    });
  };

  const handleDateChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const newDate = target.value;
    if (newDate !== selectedDate()) {
      // Preguntar si hay cambios pendientes no guardados
      if (
        pendingChanges().length > 0 &&
        !confirm("Hay cambios no guardados. ¿Cambiar de fecha sin guardar?")
      ) {
        target.value = selectedDate(); // Restaurar valor anterior
        return;
      }
      setSelectedDate(newDate);
      setPendingChanges([]); // Limpiar cambios pendientes al cambiar de fecha
      refetchAssignments();
    }
  };

  const handleSave = async () => {
    const ops = pendingChanges();
    if (ops.length === 0) {
      setError("No hay cambios para guardar");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await props.onSave(selectedDate(), ops);
      // Limpiar cambios pendientes y actualizar assignments
      setPendingChanges([]);
      await refetchAssignments();
    } catch (err: any) {
      setError(err.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (
      pendingChanges().length > 0 &&
      !confirm("Hay cambios no guardados. ¿Cerrar sin guardar?")
    ) {
      return;
    }
    props.onClose();
  };

  const hasChanges = () => pendingChanges().length > 0;

  return (
    <Show when={props.show}>
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-fit max-w-[99%] h-fit max-h-[99vh] flex flex-col">
          {/* Contenido */}
          <div class="p-6 space-y-4 flex-1 overflow-hidden">
            {/* Selector de fecha y estado */}
            <div class="flex justify-between items-center">
              <div class="flex items-center space-x-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fecha
                </label>
                <input
                  type="date"
                  value={selectedDate()}
                  onInput={handleDateChange}
                  class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <Show when={hasChanges()}>
                  <span class="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 text-sm rounded-full">
                    {pendingChanges().length} cambios pendientes
                  </span>
                </Show>
              </div>
              <button
                onClick={handleClose}
                class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Cerrar"
              >
                <CloseIcon class="w-6 h-6" />
              </button>
            </div>

            {/* Tabla de asignaciones */}
            <div class="border border-gray-300 dark:border-gray-700 rounded-lg flex-1 flex flex-col overflow-hidden">
              <Show
                when={
                  !obrasActivas.loading &&
                  !operarios.loading &&
                  !assignments.loading
                }
                fallback={
                  <div class="flex items-center justify-center h-64">
                    <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p class="ml-3 text-gray-600 dark:text-gray-400">
                      Cargando...
                    </p>
                  </div>
                }
              >
                <Show when={obrasActivas() && operarios()}>
                  <div class="flex-1 overflow-hidden">
                    <div class="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
                      <table class="min-w-full border-collapse table-fixed">
                        {" "}
                        <thead class="sticky top-0 bg-white dark:bg-gray-800 z-10">
                          <tr>
                            <th class="sticky left-0 bg-white dark:bg-gray-800 p-2 border-b border-r border-gray-300 dark:border-gray-700 text-left font-semibold text-gray-700 dark:text-gray-300 min-w-max text-sm">
                              Obras \ Operarios
                            </th>

                            <For each={operarios()}>
                              {(operario) => (
                                <th class="p-2 border-b border-gray-300 dark:border-gray-700 text-center font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap min-w-[70px] max-w-[100px] text-xs">
                                  <div class="truncate" title={operario.nombre}>
                                    {operario.nombre}
                                  </div>
                                </th>
                              )}
                            </For>
                          </tr>
                        </thead>
                        <tbody>
                          <For each={obrasActivas()}>
                            {(obra, index) => (
                              <tr
                                class={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${index() % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-800/70"}`}
                              >
                                <td class="sticky left-0 p-2 border-b border-r border-gray-300 dark:border-gray-700 font-medium text-gray-900 dark:text-white whitespace-nowrap text-sm min-w-max">
                                  <div title={obra.nombre}>
                                    {obra.id + ". " + obra.nombre}
                                  </div>
                                </td>

                                <For each={operarios()}>
                                  {(operario) => (
                                    <td
                                      class={`p-1 border-b border-gray-300 dark:border-gray-700 cursor-pointer transition-all duration-200 ${
                                        isAssigned(obra.id, operario.id)
                                          ? "bg-green-500 hover:bg-green-600 text-white"
                                          : index() % 2 === 0
                                            ? "bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                                            : "bg-gray-50 hover:bg-gray-200 dark:bg-gray-800/70 dark:hover:bg-gray-600"
                                      }`}
                                      onClick={() =>
                                        toggleAssignment(obra.id, operario.id)
                                      }
                                    >
                                      <div class="flex items-center justify-center h-8">
                                        {isAssigned(obra.id, operario.id)
                                          ? "✓"
                                          : ""}
                                      </div>
                                    </td>
                                  )}
                                </For>
                              </tr>
                            )}
                          </For>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Show>
              </Show>
            </div>
            {/* Mensaje de error */}
            <Show when={error()}>
              <div class="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p class="text-sm text-red-800 dark:text-red-200">{error()}</p>
              </div>
            </Show>
          </div>

          {/* Footer */}
          <div class="flex justify-end space-x-3 p-6 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              disabled={loading()}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={loading() || pendingChanges().length === 0}
            >
              <Show when={loading()} fallback="Guardar cambios">
                <svg
                  class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Guardando...
              </Show>
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
