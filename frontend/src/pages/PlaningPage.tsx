import { createResource, For, createSignal, createMemo } from 'solid-js';
import { useTheme } from '../contexts/ThemeContext';
import { SortIcon, SortUpIcon, SortDownIcon, EditIcon, DeleteIcon, CloseIcon, CalendarIcon } from '../components/Icons';
import DailyAssignmentModal from '../components/DailyAssignmentModal';

type Planing = {
  id: number;
  fecha: string;
  operario_id: number;
  obra_id: number;
  operario_nombre: string;
  obra_nombre: string;
};

async function fetchPlanings(): Promise<Planing[]> {
  const response = await fetch('/api/planings');
  if (!response.ok) throw new Error('Failed to fetch planings');
  return response.json();
}

async function fetchOperarios(): Promise<{id: number, nombre: string}[]> {
  const response = await fetch('/api/operarios');
  if (!response.ok) throw new Error('Failed to fetch operarios');
  return response.json();
}

async function fetchObras(): Promise<{id: number, nombre: string}[]> {
  const response = await fetch('/api/obras');
  if (!response.ok) throw new Error('Failed to fetch obras');
  return response.json();
}

type SortField = 'id' | 'fecha' | 'operario_nombre' | 'obra_nombre';
type SortDirection = 'asc' | 'desc';

export default function PlaningPage() {
  const { theme } = useTheme();
  const [planings, { mutate, refetch }] = createResource(fetchPlanings);
  const [operarios] = createResource(fetchOperarios);
  const [obras] = createResource(fetchObras);
  const [search, setSearch] = createSignal('');
  const [sortField, setSortField] = createSignal<SortField>('id');
  const [sortDirection, setSortDirection] = createSignal<SortDirection>('asc');
  const [showModal, setShowModal] = createSignal(false);
  const [showDailyAssignmentModal, setShowDailyAssignmentModal] = createSignal(false);
  const [editingId, setEditingId] = createSignal<number | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [formData, setFormData] = createSignal({
    fecha: new Date().toISOString().split('T')[0],
    operario_id: 0,
    obra_id: 0,
  });

  const filteredAndSorted = createMemo(() => {
    const data = planings() || [];
    const term = search().toLowerCase();
    let filtered = term
      ? data.filter(
          (p) =>
            p.operario_nombre.toLowerCase().includes(term) ||
            p.obra_nombre.toLowerCase().includes(term) ||
            p.fecha.toLowerCase().includes(term) ||
            p.id.toString().includes(term)
        )
      : data;

    const field = sortField();
    const dir = sortDirection();
    return [...filtered].sort((a, b) => {
      let aVal, bVal;
      if (field === 'fecha') {
        aVal = new Date(a.fecha).getTime();
        bVal = new Date(b.fecha).getTime();
      } else if (field === 'id') {
        aVal = a.id;
        bVal = b.id;
      } else if (field === 'operario_nombre') {
        aVal = a.operario_nombre.toLowerCase();
        bVal = b.operario_nombre.toLowerCase();
      } else {
        aVal = a.obra_nombre.toLowerCase();
        bVal = b.obra_nombre.toLowerCase();
      }
      if (aVal < bVal) return dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  });

  const handleSort = (field: SortField) => {
    if (sortField() === field) {
      setSortDirection(sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIconComponent = (field: SortField) => {
    if (sortField() !== field) return <SortIcon class="inline ml-1" />;
    return sortDirection() === 'asc' ? <SortUpIcon class="inline ml-1" /> : <SortDownIcon class="inline ml-1" />;
  };

  const handleEdit = (id: number) => {
    const planing = planings()?.find(p => p.id === id);
    if (planing) {
      setEditingId(id);
      setFormData({
        fecha: planing.fecha.split('T')[0],
        operario_id: planing.operario_id,
        obra_id: planing.obra_id,
      });
      setError(null);
      setShowModal(true);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Eliminar este planing?')) {
      fetch(`/api/planings/${id}`, { method: 'DELETE' })
        .then(() => {
          mutate((old: Planing[] | undefined) => old?.filter(p => p.id !== id));
        })
        .catch(console.error);
    }
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      operario_id: 0,
      obra_id: 0,
    });
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const data = formData();
    const id = editingId();
    const url = id ? `/api/planings/${id}` : '/api/planings';
    const method = id ? 'PUT' : 'POST';
    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then(savedPlaning => {
        if (id) {
          mutate((old) => old?.map(p => p.id === id ? savedPlaning : p) || []);
        } else {
          mutate((old) => old ? [...old, savedPlaning] : [savedPlaning]);
        }
        setShowModal(false);
        setEditingId(null);
      })
      .catch(err => {
        setError(err.message || 'Error al guardar');
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  const handleBatchSave = async (fecha: string, operations: { type: 'add' | 'remove'; obra_id: number; operario_id: number }[]) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/planings/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha, operations }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      // Recargar la lista de planings para reflejar los cambios
      await refetch();
      setShowDailyAssignmentModal(false);
    } catch (err: any) {
      setError(err.message || 'Error al guardar las asignaciones');
      throw err; // Re-lanzar para que el modal lo maneje
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ReturnType<typeof formData>, value: any) => {
    setFormData({ ...formData(), [field]: value });
  };

  return (
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
         <div class="flex items-center space-x-3">
           <CalendarIcon class="text-blue-600 dark:text-blue-400" />
           <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Planing</h1>
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
             onClick={() => setSearch('')}
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
       {planings.loading && (
         <div class="text-center py-8">
           <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
           <p class="mt-2 text-gray-600 dark:text-gray-400">Cargando planings...</p>
         </div>
       )}
       {planings.error && (
         <div class="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg mb-4">
           <p class="text-red-800 dark:text-red-200">Error al cargar planings: {planings.error.message}</p>
         </div>
       )}
       {!planings.loading && !planings.error && (
          <div class="overflow-x-auto">
            {/* Header */}
             <div class={`grid grid-cols-4 gap-3 px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 ${theme() === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} border-b border-gray-200 dark:border-gray-700`}>
               <div class="cursor-pointer flex items-center justify-center" onClick={() => handleSort('id')}>
                 <span>ID</span>
                 {SortIconComponent('id')}
               </div>
               <div class="cursor-pointer flex items-center justify-center" onClick={() => handleSort('fecha')}>
                 <span>Fecha</span>
                 {SortIconComponent('fecha')}
               </div>
               <div class="cursor-pointer flex items-center justify-center" onClick={() => handleSort('operario_nombre')}>
                 <span>Operario</span>
                 {SortIconComponent('operario_nombre')}
               </div>
               <div class="cursor-pointer flex items-center justify-center" onClick={() => handleSort('obra_nombre')}>
                 <span>Obra</span>
                 {SortIconComponent('obra_nombre')}
               </div>
             </div>
            {/* Body */}
            <div>
              <For each={filteredAndSorted()}>
                 {(planing) => (
                   <div class="grid grid-cols-4 gap-3 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 group relative items-center text-center">
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
                    {/* Action buttons */}
                    <div class="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                       <button
                         onClick={() => handleEdit(planing.id)}
                         class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                         title="Editar"
                       >
                         <EditIcon />
                       </button>
                       <button
                         onClick={() => handleDelete(planing.id)}
                         class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                         title="Eliminar"
                       >
                         <DeleteIcon />
                       </button>
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
                  {editingId() ? 'Editar Planing' : 'Nuevo Planing'}
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
                    onInput={(e) => handleInputChange('fecha', e.currentTarget.value)}
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
                    onChange={(e) => handleInputChange('operario_id', parseInt(e.currentTarget.value))}
                  >
                    <option value="0">Seleccionar operario</option>
                    {operarios()?.map(op => (
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
                    onChange={(e) => handleInputChange('obra_id', parseInt(e.currentTarget.value))}
                  >
                    <option value="0">Seleccionar obra</option>
                    {obras()?.map(ob => (
                      <option value={ob.id}>{ob.nombre}</option>
                    ))}
                  </select>
                </div>
                {error() && (
                  <div class="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <p class="text-sm text-red-800 dark:text-red-200">{error()}</p>
                  </div>
                )}
                <div class="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    disabled={loading()}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading()}
                  >
                    {loading() ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
     </div>
  );
}