import { SortIcon, SortUpIcon, SortDownIcon } from "../components/Icons";

// Types
export type SortDirection = "asc" | "desc";

export interface SortConfig<T> {
  field: keyof T;
  direction: SortDirection;
}

export interface SortDataParams<T> {
  data: T[];
  field: keyof T;
  direction: SortDirection;
  getValue?: (item: T, field: keyof T) => any;
}

// Sort Handlers
export function createSortHandler<T>(
  sortField: () => keyof T,
  setSortField: (field: keyof T) => void,
  sortDirection: () => SortDirection,
  setSortDirection: (dir: SortDirection) => void,
) {
  return (field: keyof T) => {
    if (sortField() === field) {
      setSortDirection(sortDirection() === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
}

// Sort UI Components
export function createSortIconComponent<T>(
  sortField: () => keyof T,
  sortDirection: () => SortDirection,
) {
  return (field: keyof T) => {
    if (sortField() !== field) return <SortIcon class="inline ml-1" />;
    return sortDirection() === "asc" ? (
      <SortUpIcon class="inline ml-1" />
    ) : (
      <SortDownIcon class="inline ml-1" />
    );
  };
}

// Sort Algorithms
export function sortData<T>(params: SortDataParams<T>): T[] {
  const { data, field, direction, getValue } = params;
  return [...data].sort((a, b) => {
    let aVal = getValue ? getValue(a, field) : a[field];
    let bVal = getValue ? getValue(b, field) : b[field];

    // Handle different types
    if (typeof aVal === "string" && typeof bVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });
}