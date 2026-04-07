import { createResource, For } from 'solid-js';
import { DashboardIcon } from '../components/Icons';


async function fetchObrasCount(): Promise<number> {
  const response = await fetch('/api/obras');
  if (!response.ok) throw new Error('Failed to fetch obras count');
  const data = await response.json();
  return data.length;
}

async function fetchOperariosCount(): Promise<number> {
  const response = await fetch('/api/operarios');
  if (!response.ok) throw new Error('Failed to fetch operarios count');
  const data = await response.json();
  return data.length;
}

async function fetchPlaningsCount(): Promise<number> {
  const response = await fetch('/api/planings');
  if (!response.ok) throw new Error('Failed to fetch planings count');
  const data = await response.json();
  return data.length;
}

const cards = [
  { title: 'Obras', path: '/obras', color: 'bg-blue-500', hoverColor: 'hover:bg-blue-600', description: 'Gestionar obras' },
  { title: 'Operarios', path: '/operarios', color: 'bg-green-500', hoverColor: 'hover:bg-green-600', description: 'Gestionar operarios' },
  { title: 'Planing', path: '/planing', color: 'bg-purple-500', hoverColor: 'hover:bg-purple-600', description: 'Gestionar planing' },
];

export default function DashboardPage() {

  const [obrasCount] = createResource(fetchObrasCount);
  const [operariosCount] = createResource(fetchOperariosCount);
  const [planingsCount] = createResource(fetchPlaningsCount);

  const counts = [obrasCount, operariosCount, planingsCount];

  return (
    <div class="p-6">
       <div class="flex items-center space-x-3 mb-8">
         <DashboardIcon class="text-blue-600 dark:text-blue-400" />
         <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
       </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <For each={cards}>
          {(card, index) => (
            <a
              href={card.path}
              class={`${card.color} ${card.hoverColor} rounded-xl shadow-lg p-6 text-white transition-transform transform hover:scale-105 hover:shadow-2xl block`}
            >
              <div class="flex justify-between items-start">
                <div>
                  <h2 class="text-2xl font-bold">{card.title}</h2>
                  <p class="mt-2 opacity-90">{card.description}</p>
                </div>
                <div class="text-4xl font-bold">
                  {counts[index()]?.loading ? '...' : counts[index()]()}
                </div>
              </div>
              <div class="mt-6 text-sm font-medium opacity-80">
                Ver detalles →
              </div>
            </a>
          )}
        </For>
      </div>
      <div class="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Resumen del sistema</h3>
          <ul class="space-y-3">
            <li class="flex justify-between">
              <span class="text-gray-700 dark:text-gray-300">Total de obras</span>
              <span class="font-medium">{obrasCount.loading ? '...' : obrasCount()}</span>
            </li>
            <li class="flex justify-between">
              <span class="text-gray-700 dark:text-gray-300">Total de operarios</span>
              <span class="font-medium">{operariosCount.loading ? '...' : operariosCount()}</span>
            </li>
            <li class="flex justify-between">
              <span class="text-gray-700 dark:text-gray-300">Total de planings</span>
              <span class="font-medium">{planingsCount.loading ? '...' : planingsCount()}</span>
            </li>
          </ul>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Acciones rápidas</h3>
          <div class="space-y-4">
            <a href="/obras" class="block p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors">
              <div class="font-medium text-blue-800 dark:text-blue-200">Crear nueva obra</div>
              <div class="text-sm text-blue-600 dark:text-blue-400">Agregar una nueva obra al sistema</div>
            </a>
            <a href="/operarios" class="block p-4 bg-green-50 dark:bg-green-900/30 rounded-lg hover:bg-green-100 dark:hover:bg-green-800/50 transition-colors">
              <div class="font-medium text-green-800 dark:text-green-200">Registrar nuevo operario</div>
              <div class="text-sm text-green-600 dark:text-green-400">Agregar un nuevo operario</div>
            </a>
            <a href="/planing" class="block p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800/50 transition-colors">
              <div class="font-medium text-purple-800 dark:text-purple-200">Programar nuevo planing</div>
              <div class="text-sm text-purple-600 dark:text-purple-400">Asignar operario a obra</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}