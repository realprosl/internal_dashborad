import { createStore } from 'solid-js/store';
import type { Obra, Operario, Planing, Material } from '../types';

// Create the store
const [store, setStore] = createStore({
  // Estado inicial
  obras: [] as Obra[],
  operarios: [] as Operario[],
  planings: [] as Planing[],
  materiales: [] as Material[],
  loading: false,
  error: null as string | null,
});

// Acciones de fetching
const fetchObras = async () => {
  setStore('loading', true);
  setStore('error', null);
  try {
    const response = await fetch('/api/obras');
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const obras = await response.json();
    setStore('obras', obras);
    setStore('loading', false);
  } catch (error) {
    setStore('error', error instanceof Error ? error.message : 'Error fetching obras');
    setStore('loading', false);
  }
};

const fetchOperarios = async () => {
  setStore('loading', true);
  setStore('error', null);
  try {
    const response = await fetch('/api/operarios');
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const operarios = await response.json();
    setStore('operarios', operarios);
    setStore('loading', false);
  } catch (error) {
    setStore('error', error instanceof Error ? error.message : 'Error fetching operarios');
    setStore('loading', false);
  }
};

const fetchPlanings = async () => {
  setStore('loading', true);
  setStore('error', null);
  try {
    const response = await fetch('/api/planings');
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const planings = await response.json();
    setStore('planings', planings);
    setStore('loading', false);
  } catch (error) {
    setStore('error', error instanceof Error ? error.message : 'Error fetching planings');
    setStore('loading', false);
  }
};

const fetchMateriales = async () => {
  setStore('loading', true);
  setStore('error', null);
  try {
    const response = await fetch('/api/materiales');
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const materiales = await response.json();
    setStore('materiales', materiales);
    setStore('loading', false);
  } catch (error) {
    setStore('error', error instanceof Error ? error.message : 'Error fetching materiales');
    setStore('loading', false);
  }
};

const fetchAll = async () => {
  setStore('loading', true);
  setStore('error', null);
  try {
    const [obrasRes, operariosRes, planingsRes, materialesRes] = await Promise.all([
      fetch('/api/obras'),
      fetch('/api/operarios'),
      fetch('/api/planings'),
      fetch('/api/materiales')
    ]);

    if (!obrasRes.ok) throw new Error(`HTTP ${obrasRes.status}: Error fetching obras`);
    if (!operariosRes.ok) throw new Error(`HTTP ${operariosRes.status}: Error fetching operarios`);
    if (!planingsRes.ok) throw new Error(`HTTP ${planingsRes.status}: Error fetching planings`);
    if (!materialesRes.ok) throw new Error(`HTTP ${materialesRes.status}: Error fetching materiales`);

    const obras = await obrasRes.json();
    const operarios = await operariosRes.json();
    const planings = await planingsRes.json();
    const materiales = await materialesRes.json();

    setStore({
      obras,
      operarios,
      planings,
      materiales,
      loading: false
    });
  } catch (error) {
    setStore('error', error instanceof Error ? error.message : 'Error fetching data');
    setStore('loading', false);
  }
};

// Acciones CRUD para Obras
const addObra = async (obraData: Omit<Obra, 'id'>) => {
  setStore('loading', true);
  setStore('error', null);
  try {
    const response = await fetch('/api/obras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(obraData)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const newObra = await response.json();
    setStore('obras', [...store.obras, newObra]);
    setStore('loading', false);
    return newObra;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error adding obra';
    setStore('error', errorMsg);
    setStore('loading', false);
    throw new Error(errorMsg);
  }
};

const updateObra = async (id: number, obraData: Partial<Obra>) => {
  setStore('loading', true);
  setStore('error', null);
  try {
    const response = await fetch(`/api/obras/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(obraData)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const updatedObra = await response.json();

    // Update the specific obra in the store
    const index = store.obras.findIndex(o => o.id === id);
    if (index !== -1) {
      setStore('obras', index, updatedObra);
    }

    setStore('loading', false);
    return updatedObra;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error updating obra';
    setStore('error', errorMsg);
    setStore('loading', false);
    throw new Error(errorMsg);
  }
};

const deleteObra = async (id: number) => {
  setStore('loading', true);
  setStore('error', null);
  try {
    const response = await fetch(`/api/obras/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    setStore('obras', store.obras.filter(o => o.id !== id));
    setStore('loading', false);
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error deleting obra';
    setStore('error', errorMsg);
    setStore('loading', false);
    throw new Error(errorMsg);
  }
};

// Acciones CRUD para Operarios
const addOperario = async (operarioData: Omit<Operario, 'id'>) => {
  setStore('loading', true);
  setStore('error', null);
  try {
    const response = await fetch('/api/operarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(operarioData)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const newOperario = await response.json();
    setStore('operarios', [...store.operarios, newOperario]);
    setStore('loading', false);
  } catch (error) {
    setStore('error', error instanceof Error ? error.message : 'Error adding operario');
    setStore('loading', false);
  }
};

const updateOperario = async (id: number, operarioData: Partial<Operario>) => {
  setStore('loading', true);
  setStore('error', null);
  try {
    const response = await fetch(`/api/operarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(operarioData)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const updatedOperario = await response.json();

    // Update the specific operario in the store
    const index = store.operarios.findIndex(o => o.id === id);
    if (index !== -1) {
      setStore('operarios', index, updatedOperario);
    }

    setStore('loading', false);
  } catch (error) {
    setStore('error', error instanceof Error ? error.message : 'Error updating operario');
    setStore('loading', false);
  }
};

const deleteOperario = async (id: number) => {
  setStore('loading', true);
  setStore('error', null);
  try {
    const response = await fetch(`/api/operarios/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    setStore('operarios', store.operarios.filter(o => o.id !== id));
    setStore('loading', false);
  } catch (error) {
    setStore('error', error instanceof Error ? error.message : 'Error deleting operario');
    setStore('loading', false);
  }
};

// Acciones CRUD para Planings
const addPlaning = async (planingData: Omit<Planing, 'id'>) => {
  setStore('loading', true);
  setStore('error', null);
  try {
    const response = await fetch('/api/planings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planingData)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const newPlaning = await response.json();
    setStore('planings', [...store.planings, newPlaning]);
    setStore('loading', false);
  } catch (error) {
    setStore('error', error instanceof Error ? error.message : 'Error adding planing');
    setStore('loading', false);
  }
};

const updatePlaning = async (id: number, planingData: Partial<Planing>) => {
  setStore('loading', true);
  setStore('error', null);
  try {
    const response = await fetch(`/api/planings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planingData)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const updatedPlaning = await response.json();

    // Update the specific planing in the store
    const index = store.planings.findIndex(p => p.id === id);
    if (index !== -1) {
      setStore('planings', index, updatedPlaning);
    }

    setStore('loading', false);
  } catch (error) {
    setStore('error', error instanceof Error ? error.message : 'Error updating planing');
    setStore('loading', false);
  }
};

const deletePlaning = async (id: number) => {
  setStore('loading', true);
  setStore('error', null);
  try {
    const response = await fetch(`/api/planings/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    setStore('planings', store.planings.filter(p => p.id !== id));
    setStore('loading', false);
  } catch (error) {
    setStore('error', error instanceof Error ? error.message : 'Error deleting planing');
    setStore('loading', false);
  }
};

// Acciones CRUD para Materiales
const addMaterial = async (materialData: Omit<Material, 'id'>) => {
  setStore('loading', true);
  setStore('error', null);
  try {
    const response = await fetch('/api/materiales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(materialData)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const newMaterial = await response.json();
    setStore('materiales', [...store.materiales, newMaterial]);
    setStore('loading', false);
    return newMaterial;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error adding material';
    setStore('error', errorMsg);
    setStore('loading', false);
    throw new Error(errorMsg);
  }
};

const updateMaterial = async (id: number, materialData: Partial<Material>) => {
  setStore('loading', true);
  setStore('error', null);
  try {
    const response = await fetch(`/api/materiales/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(materialData)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const updatedMaterial = await response.json();

    // Update the specific material in the store
    const index = store.materiales.findIndex(m => m.id === id);
    if (index !== -1) {
      setStore('materiales', index, updatedMaterial);
    }

    setStore('loading', false);
    return updatedMaterial;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error updating material';
    setStore('error', errorMsg);
    setStore('loading', false);
    throw new Error(errorMsg);
  }
};

const deleteMaterial = async (id: number) => {
  setStore('loading', true);
  setStore('error', null);
  try {
    const response = await fetch(`/api/materiales/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    setStore('materiales', store.materiales.filter(m => m.id !== id));
    setStore('loading', false);
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error deleting material';
    setStore('error', errorMsg);
    setStore('loading', false);
    throw new Error(errorMsg);
  }
};

// Helpers
const getObraById = (id: number) => {
  return store.obras.find(o => o.id === id);
};

const getOperarioById = (id: number) => {
  return store.operarios.find(o => o.id === id);
};

const getPlaningById = (id: number) => {
  return store.planings.find(p => p.id === id);
};

const getMaterialById = (id: number) => {
  return store.materiales.find(m => m.id === id);
};

// Export the store and actions
export const useAppStore = () => ({
  // State
  ...store,

  // Actions
  fetchObras,
  fetchOperarios,
  fetchPlanings,
  fetchAll,

  // CRUD Obras
  addObra,
  updateObra,
  deleteObra,

  // CRUD Operarios
  addOperario,
  updateOperario,
  deleteOperario,

  // CRUD Planings
  addPlaning,
  updatePlaning,
  deletePlaning,

  // CRUD Materiales
  fetchMateriales,
  addMaterial,
  updateMaterial,
  deleteMaterial,

  // Helpers
  getObraById,
  getOperarioById,
  getPlaningById,
  getMaterialById,
});