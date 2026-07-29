import { createStore } from 'solid-js/store';
import type { Obra, Operario, Planing, Material, User } from '../types';
import { apiFetch, ApiError, apiUrl } from '../config';

const [store, setStore] = createStore({
  // Estado inicial — authLoading=true evita que el guard redirija a
  // /login antes de saber si hay sesión.
  obras: [] as Obra[],
  operarios: [] as Operario[],
  planings: [] as Planing[],
  materiales: [] as Material[],
  loading: false,
  error: null as string | null,
  currentUser: null as User | null,
  authLoading: true as boolean,
});

/**
 * Hook called from the auth guard (AppInitializer). On 401 clears the user
 * so the guard redirects to /login. On any other error keeps state as-is
 * (offline shouldn't trigger logout).
 */
const fetchCurrentUser = async (): Promise<User | null> => {
  setStore('authLoading', true);
  try {
    const user = await apiFetch<User>('/auth/me');
    setStore('currentUser', user);
    setStore('authLoading', false);
    return user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      setStore('currentUser', null);
    }
    setStore('authLoading', false);
    return null;
  }
};

const logout = async () => {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch {
    // ignore — borramos el estado local igualmente
  }
  setStore('currentUser', null);
  setStore('obras', []);
  setStore('operarios', []);
  setStore('planings', []);
  setStore('materiales', []);
};

// Cuando una llamada autenticada falla con 401 (sesión expirada) limpiamos
// el currentUser para que el guard redirija a /login. Un 403 (sin permisos)
// NO redirige — solo se setea el error para mostrarlo al usuario.
const handleAuthError = (err: unknown): never => {
  if (err instanceof ApiError) {
    if (err.status === 401) {
      setStore('currentUser', null);
    }
    setStore('error', err.message);
  } else {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    setStore('error', msg);
  }
  throw err;
};

const fetchObras = async () => {
  setStore('loading', true);
  setStore('error', null);
  try {
    const obras = await apiFetch<Obra[]>('/api/obras');
    setStore('obras', obras);
    setStore('loading', false);
  } catch (err) {
    setStore('loading', false);
    handleAuthError(err);
  }
};

const fetchOperarios = async () => {
  setStore('loading', true);
  setStore('error', null);
  try {
    const operarios = await apiFetch<Operario[]>('/api/operarios');
    setStore('operarios', operarios);
    setStore('loading', false);
  } catch (err) {
    setStore('loading', false);
    handleAuthError(err);
  }
};

const fetchPlanings = async () => {
  setStore('loading', true);
  setStore('error', null);
  try {
    const planings = await apiFetch<Planing[]>('/api/planings');
    setStore('planings', planings);
    setStore('loading', false);
  } catch (err) {
    setStore('loading', false);
    handleAuthError(err);
  }
};

const fetchMateriales = async () => {
  setStore('loading', true);
  setStore('error', null);
  try {
    const materiales = await apiFetch<Material[]>('/api/materiales');
    setStore('materiales', materiales);
    setStore('loading', false);
  } catch (err) {
    setStore('loading', false);
    handleAuthError(err);
  }
};

const fetchAll = async () => {
  setStore('loading', true);
  setStore('error', null);

  // Usamos allSettled para que un fallo de un endpoint no impida
  // rellenar los otros. Si los 4 fallan, mostramos el primer error.
  const results = await Promise.allSettled([
    apiFetch<Obra[]>('/api/obras'),
    apiFetch<Operario[]>('/api/operarios'),
    apiFetch<Planing[]>('/api/planings'),
    apiFetch<Material[]>('/api/materiales'),
  ]);

  const update: Partial<{
    obras: Obra[];
    operarios: Operario[];
    planings: Planing[];
    materiales: Material[];
    loading: boolean;
    error: string | null;
  }> = { loading: false };

  const errors: string[] = [];
  if (results[0].status === "fulfilled") update.obras = results[0].value;
  else errors.push("obras: " + (results[0].reason?.message ?? "failed"));
  if (results[1].status === "fulfilled") update.operarios = results[1].value;
  else errors.push("operarios: " + (results[1].reason?.message ?? "failed"));
  if (results[2].status === "fulfilled") update.planings = results[2].value;
  else errors.push("planings: " + (results[2].reason?.message ?? "failed"));
  if (results[3].status === "fulfilled") update.materiales = results[3].value;
  else errors.push("materiales: " + (results[3].reason?.message ?? "failed"));

  if (errors.length > 0) {
    update.error = errors.join(" | ");
  }

  setStore(update);
};

// CRUD Obras
const addObra = async (obraData: Omit<Obra, 'id'>) => {
  setStore('error', null);
  try {
    const newObra = await apiFetch<Obra>('/api/obras', {
      method: 'POST',
      body: JSON.stringify(obraData),
    });
    setStore('obras', [...store.obras, newObra]);
    return newObra;
  } catch (err) {
    handleAuthError(err);
  }
};

const updateObra = async (id: number, obraData: Partial<Obra>) => {
  setStore('error', null);
  try {
    const updated = await apiFetch<Obra>(`/api/obras/${id}`, {
      method: 'PUT',
      body: JSON.stringify(obraData),
    });
    const idx = store.obras.findIndex(o => o.id === id);
    if (idx !== -1) setStore('obras', idx, updated);
    return updated;
  } catch (err) {
    handleAuthError(err);
  }
};

const deleteObra = async (id: number) => {
  setStore('error', null);
  try {
    await apiFetch(`/api/obras/${id}`, { method: 'DELETE' });
    setStore('obras', store.obras.filter(o => o.id !== id));
  } catch (err) {
    handleAuthError(err);
  }
};

// CRUD Operarios
const addOperario = async (operarioData: Omit<Operario, 'id'>) => {
  setStore('error', null);
  try {
    const newOperario = await apiFetch<Operario>('/api/operarios', {
      method: 'POST',
      body: JSON.stringify(operarioData),
    });
    setStore('operarios', [...store.operarios, newOperario]);
  } catch (err) {
    handleAuthError(err);
  }
};

const updateOperario = async (id: number, operarioData: Partial<Operario>) => {
  setStore('error', null);
  try {
    const updated = await apiFetch<Operario>(`/api/operarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(operarioData),
    });
    const idx = store.operarios.findIndex(o => o.id === id);
    if (idx !== -1) setStore('operarios', idx, updated);
  } catch (err) {
    handleAuthError(err);
  }
};

const deleteOperario = async (id: number) => {
  setStore('error', null);
  try {
    await apiFetch(`/api/operarios/${id}`, { method: 'DELETE' });
    setStore('operarios', store.operarios.filter(o => o.id !== id));
  } catch (err) {
    handleAuthError(err);
  }
};

// CRUD Planings
const addPlaning = async (planingData: Omit<Planing, 'id'>) => {
  setStore('error', null);
  try {
    const newPlaning = await apiFetch<Planing>('/api/planings', {
      method: 'POST',
      body: JSON.stringify(planingData),
    });
    setStore('planings', [...store.planings, newPlaning]);
  } catch (err) {
    handleAuthError(err);
  }
};

const updatePlaning = async (id: number, planingData: Partial<Planing>) => {
  setStore('error', null);
  try {
    const updated = await apiFetch<Planing>(`/api/planings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(planingData),
    });
    const idx = store.planings.findIndex(p => p.id === id);
    if (idx !== -1) setStore('planings', idx, updated);
  } catch (err) {
    handleAuthError(err);
  }
};

const deletePlaning = async (id: number) => {
  setStore('error', null);
  try {
    await apiFetch(`/api/planings/${id}`, { method: 'DELETE' });
    setStore('planings', store.planings.filter(p => p.id !== id));
  } catch (err) {
    handleAuthError(err);
  }
};

// CRUD Materiales
const addMaterial = async (materialData: Omit<Material, 'id'>) => {
  setStore('error', null);
  try {
    const newMaterial = await apiFetch<Material>('/api/materiales', {
      method: 'POST',
      body: JSON.stringify(materialData),
    });
    setStore('materiales', [...store.materiales, newMaterial]);
    return newMaterial;
  } catch (err) {
    handleAuthError(err);
  }
};

const updateMaterial = async (id: number, materialData: Partial<Material>) => {
  setStore('error', null);
  try {
    const updated = await apiFetch<Material>(`/api/materiales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(materialData),
    });
    const idx = store.materiales.findIndex(m => m.id === id);
    if (idx !== -1) setStore('materiales', idx, updated);
    return updated;
  } catch (err) {
    handleAuthError(err);
  }
};

const deleteMaterial = async (id: number) => {
  setStore('error', null);
  try {
    await apiFetch(`/api/materiales/${id}`, { method: 'DELETE' });
    setStore('materiales', store.materiales.filter(m => m.id !== id));
    return true;
  } catch (err) {
    handleAuthError(err);
  }
};

// Helpers
const getObraById = (id: number) => store.obras.find(o => o.id === id);
const getOperarioById = (id: number) =>
  store.operarios.find(o => o.id === id);
const getPlaningById = (id: number) =>
  store.planings.find(p => p.id === id);
const getMaterialById = (id: number) =>
  store.materiales.find(m => m.id === id);

// Auth helpers
const isAdmin = () => store.currentUser?.role === 'admin';
const isAuthenticated = () => store.currentUser !== null;

// Login: navega al endpoint que arranca el OAuth flow. Usamos ruta relativa
// (apiUrl con prefijo '') para que en dev pase por el proxy y la cookie
// quede en el origen del frontend (SameSite=Lax funciona).
const login = () => {
  window.location.href = apiUrl('/auth/google');
};

export const useAppStore = () => ({
  ...store,

  // Auth
  fetchCurrentUser,
  logout,
  login,
  isAdmin,
  isAuthenticated,

  // Datos
  fetchObras,
  fetchOperarios,
  fetchPlanings,
  fetchMateriales,
  fetchAll,

  // CRUD
  addObra,
  updateObra,
  deleteObra,
  addOperario,
  updateOperario,
  deleteOperario,
  addPlaning,
  updatePlaning,
  deletePlaning,
  addMaterial,
  updateMaterial,
  deleteMaterial,

  // Helpers
  getObraById,
  getOperarioById,
  getPlaningById,
  getMaterialById,
});