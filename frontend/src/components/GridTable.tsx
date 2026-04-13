import {
  type JSX,
  children,
  createMemo,
  createSignal,
  For,
  type Accessor,
  Show,
} from "solid-js";
import type { Store } from "solid-js/store";

// Interfaces con tipos genéricos
interface HeaderColumn<T> {
  label: JSX.Element;
  key?: keyof T;
}

interface GridTableProps<T> {
  data: T[];
  class?: string;
  headers: HeaderColumn<T>[];
  rows: (row: T, index: () => number) => JSX.Element[];
  gap?: number;
  tempale?: string;
  sortable?: boolean;
  ascIcon?: JSX.Element;
  descIcon?: JSX.Element;
  activeSortIconClass?: string; // Clases Tailwind para icono de ordenación activo
  inactiveSortIconClass?: string; // Clases Tailwind para icono de ordenación inactivo
  headerClass?: string;
  rowClass?: string;
  filter?: Accessor<string> | Store<string>;
  division?: string;
}

// Iconos por defecto para ordenación
const DefaultAscIcon = (props: { iconClass?: string }) => (
  <svg
    class={`w-4 h-4 ml-1 ${props.iconClass || ""}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M5 15l7-7 7 7"
    />
  </svg>
);

const DefaultDescIcon = (props: { iconClass?: string }) => (
  <svg
    class={`w-4 h-4 ml-1 ${props.iconClass || ""}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

export function GridTable<T>(props: GridTableProps<T>) {
  // Memo para el gap, retorna la clase de Tailwind
  const gapClass = createMemo(() =>
    props.gap !== undefined ? `gap-${props.gap}` : "gap-4",
  );

  const [columns, setColumns] = createSignal(props.headers.length);
  const [sortColumn, setSortColumn] = createSignal<number | null>(null);
  const [sortDirection, setSortDirection] = createSignal<"asc" | "desc">("asc");

  // Iconos de ordenación
  const ascIcon = () => props.ascIcon || <DefaultAscIcon />;
  const descIcon = () => props.descIcon || <DefaultDescIcon />;

  // Datos filtrados
  const filteredData = createMemo(() => {
    if (!props.filter) return props.data;

    const filterValue =
      typeof props.filter === "function" ? props.filter() : props.filter;

    if (!filterValue.trim()) return props.data;

    const searchTerm = filterValue.toLowerCase();
    return props.data.filter((row) => {
      return Object.values(row as any).some((value) =>
        String(value).toLowerCase().includes(searchTerm),
      );
    });
  });

  // Datos ordenados
  const sortedData = createMemo(() => {
    const data = filteredData();
    const columnIndex = sortColumn();

    if (columnIndex === null || !props.sortable) return data;

    const header = props.headers[columnIndex];
    if (!header.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[header.key!];
      const bValue = b[header.key!];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection() === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection() === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  });

  // Función para manejar clic en header
  const handleHeaderClick = (index: number) => {
    if (!props.sortable || !props.headers[index].key) return;

    if (sortColumn() === index) {
      // Cambiar dirección si es la misma columna
      setSortDirection(sortDirection() === "asc" ? "desc" : "asc");
    } else {
      // Nueva columna, orden ascendente por defecto
      setSortColumn(index);
      setSortDirection("asc");
    }
  };

  // Resolvemos los headers como children para contar las columnas
  const headerElements = createMemo(() =>
    props.headers.map((header, index) => {
      const isSortable = props.sortable && header.key;
      const isSorted = sortColumn() === index;

      return (
        <div
          class={` flex items-center justify-center relative ${isSortable ? "cursor-pointer" : ""}`}
          onClick={() => handleHeaderClick(index)}
        >
          {header.label}
          <Show when={isSortable}>
            <div class="absolute right-[10%]">
              <Show when={isSorted && sortDirection() === "asc"}>
                <div class={props.activeSortIconClass}>{ascIcon()}</div>
              </Show>
              <Show when={isSorted && sortDirection() === "desc"}>
                <div class={props.activeSortIconClass}>{descIcon()}</div>
              </Show>
              <Show when={!isSorted}>
                <div
                  class={`w-4 h-4 ml-1 ${props.inactiveSortIconClass || "opacity-30"}`}
                >
                  <DefaultAscIcon iconClass={props.inactiveSortIconClass} />
                </div>
              </Show>
            </div>
          </Show>
        </div>
      );
    }),
  );

  const headerChildren = children(() => headerElements());

  // Actualizamos columns si headers cambia
  createMemo(() => {
    const count = headerChildren.toArray().length;
    setColumns(count);
  });

  // Clases de división
  const divisionClass = () => props.division || "";
  const headerClass = () => props.headerClass || "";
  const rowClass = () => props.rowClass || "";
  const className = () => props.class || "";
  const template = () =>
    props.template ||
    `grid-template-columns: repeat(${columns()}, minmax(0, 1fr))`;

  return (
    <div class={` w-full overflow-x-auto  ${divisionClass()}`}>
      <div class={`${className()} min-w-full flex flex-col`}>
        {/* Header */}
        <div
          data-type="grid-header"
          class={`grid ${template()} ${gapClass()} ${headerClass()} px-4 py-3`}
        >
          {headerChildren()}
        </div>

        {/* Rows */}
        <For each={sortedData()}>
          {(row: T, index) => {
            const rowContent = children(() => props.rows(row, index));

            return (
              <div
                class={`grid ${template()} ${gapClass()} ${rowClass()} px-4 py-3 ${divisionClass()}`}
              >
                {rowContent()}
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
}
