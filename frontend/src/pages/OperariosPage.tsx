import { createResource, For, createSignal, createMemo } from 'solid-js';
import { useTheme } from '../contexts/ThemeContext';
import { SortIcon, SortUpIcon, SortDownIcon, EditIcon, DeleteIcon, CloseIcon, PersonIcon } from '../components/Icons';

type Operario = {
  id: number;
  nombre: string;
  gasto_diario: number;
};

async function fetchOperarios(): Promise<Operario[]> {
  const response = await fetch('/api/operarios');
  if (!response.ok) throw new Error('Failed to fetch operarios');
  return response.json();
}

type SortField = 'id' | 'nombre' | 'gasto_diario';
type SortDirection = 'asc' | 'desc';

export default function OperariosPage() {
  const { theme } = useTheme();
  const [operarios, { mutate }] = createResource(fetchOperarios);
  const [search, setSearch] = createSignal('');
  const [sortField, setSortField] = createSignal<SortField>('id');
  const [sortDirection, setSortDirection] = createSignal<SortDirection>('asc');
  const [showModal, setShowModal] = createSignal(false);
  const [editingId, setEditingId] = createSignal<number | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [formData, setFormData] = createSignal({
    nombre: '',
    gasto_diario: 0,
  });

  const filteredAndSorted = createMemo(() => {
    const data = operarios() || [];
    const term = search().toLowerCase();
    let filtered = term
      ? data.filter(
          (o) =>
            o.nombre.toLowerCase().includes(term) ||
            o.id.toString().includes(term) ||
            o.gasto_diario.toString().includes(term)
        )
      : data;

    const field = sortField();
    const dir = sortDirection();
    return [...filtered].sort((a, b) => {
      let aVal, bVal;
      if (field === 'gasto_diario') {
        aVal = a.gasto_diario;
        bVal = b.gasto_diario;
      } else if (field === 'id') {
        aVal = a.id;
        bVal = b.id;
      } else {
        aVal = a.nombre.toLowerCase();
        bVal = b.nombre.toLowerCase();
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
    const operario = operarios()?.find(o => o.id === id);
    if (operario) {
      setEditingId(id);
      setFormData({
        nombre: operario.nombre,
        gasto_diario: operario.gasto_diario,
      });
      setError(null);
      setShowModal(true);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Eliminar este operario?')) {
      fetch(`/api/operarios/${id}`, { method: 'DELETE' })
        .then(() => {
          mutate((old: Operario[] | undefined) => old?.filter(o => o.id !== id));
        })
        .catch(console.error);
    }
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData({ nombre: '', gasto_diario: 0 });
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const data = formData();
    const id = editingId();
    const url = id ? `/api/operarios/${id}` : '/api/operarios';
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
      .then(savedOperario => {
        if (id) {
          mutate((old) => old?.map(o => o.id === id ? savedOperario : o) || []);
        } else {
          mutate((old) => old ? [...old, savedOperario] : [savedOperario]);
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

  const handleInputChange = (field: keyof ReturnType<typeof formData>, value: any) => {
    setFormData({ ...formData(), [field]: value });
  };

  return (
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
         <div class="flex items-center space-x-3">
           <PersonIcon class="text-blue-600 dark:text-blue-400" />
           <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Operarios</h1>
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
             onClick={() => setSearch('')}
             class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
             aria-label="Limpiar búsqueda"
           >
             <CloseIcon class="w-4 h-4" />
           </button>
         )}
        </div>
       {operarios.loading && (
         <div class="text-center py-8">
           <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
           <p class="mt-2 text-gray-600 dark:text-gray-400">Cargando operarios...</p>
         </div>
       )}
       {operarios.error && (
         <div class="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg mb-4">
           <p class="text-red-800 dark:text-red-200">Error al cargar operarios: {operarios.error.message}</p>
         </div>
       )}
       {!operarios.loading && !operarios.error && (
          <div class="overflow-x-auto">
            {/* Header */}
             <div class={`grid grid-cols-3 gap-3 px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 ${theme() === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} border-b border-gray-200 dark:border-gray-700`}>
               <div class="cursor-pointer flex items-center justify-center" onClick={() => handleSort('id')}>
                 <span>ID</span>
                 {SortIconComponent('id')}
               </div>
               <div class="cursor-pointer flex items-center justify-center" onClick={() => handleSort('nombre')}>
                 <span>Nombre</span>
                 {SortIconComponent('nombre')}
               </div>
               <div class="cursor-pointer flex items-center justify-center" onClick={() => handleSort('gasto_diario')}>
                 <span>Gasto Diario</span>
                 {SortIconComponent('gasto_diario')}
               </div>
             </div>
            {/* Body */}
            <div>
              <For each={filteredAndSorted()}>
                 {(operario) => (
                   <div class="grid grid-cols-3 gap-3 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 group relative items-center text-center">
                     <div class="flex items-center justify-center text-sm text-gray-900 dark:text-white whitespace-nowrap">
                       {operario.id}
                     </div>
                     <div class="flex items-center justify-center text-sm text-gray-900 dark:text-white whitespace-nowrap">
                       {operario.nombre}
                     </div>
                     <div class="flex items-center justify-center text-sm text-gray-900 dark:text-white whitespace-nowrap">
                       ${operario.gasto_diario.toLocaleString()}
                     </div>
                    {/* Action buttons */}
                    <div class="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                       <button
                         onClick={() => handleEdit(operario.id)}
                         class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                         title="Editar"
                       >
                         <EditIcon />
                       </button>
                       <button
                         onClick={() => handleDelete(operario.id)}
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
                {editingId() ? 'Editar Operario' : 'Nuevo Operario'}
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
                  onInput={(e) => handleInputChange('nombre', e.currentTarget.value)}
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Gasto Diario
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={formData().gasto_diario}
                  onInput={(e) => handleInputChange('gasto_diario', parseFloat(e.currentTarget.value))}
                />
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