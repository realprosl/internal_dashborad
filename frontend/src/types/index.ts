export type Obra = {
  id: number;
  nombre: string;
  valor_contrato: number;
  estado: string;
  fecha_inicio: string;
};

export type Operario = {
  id: number;
  nombre: string;
  gasto_diario: number;
};

export type Planing = {
  id: number;
  fecha: string;
  operario_id: number;
  obra_id: number;
  operario_nombre?: string;
  obra_nombre?: string;
};