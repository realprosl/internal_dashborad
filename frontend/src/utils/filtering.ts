import { sortData, type SortDirection } from "./sorting";

// Types
export interface FilterConfig<T> {
  searchTerm: string;
  fields: (keyof T)[];
  customFilter?: (item: T, term: string) => boolean;
}

export interface FilterDataParams<T> {
  data: T[];
  config: FilterConfig<T>;
}

export interface CreateFilterAndSortParams<T> {
  data: T[];
  searchTerm: string;
  sortField: keyof T;
  sortDirection: SortDirection;
  filterFields?: (keyof T)[];
  customFilter?: (item: T, term: string) => boolean;
  getSortValue?: (item: T, field: keyof T) => any;
}

// Filter Algorithms
export function filterData<T>(params: FilterDataParams<T>): T[] {
  const { data, config } = params;
  const { searchTerm, fields, customFilter } = config;

  if (!searchTerm.trim()) return data;

  const term = searchTerm.toLowerCase();

  return data.filter(item => {
    // Use custom filter if provided
    if (customFilter) {
      return customFilter(item, term);
    }

    // Default filter: check specified fields
    return fields.some(field => {
      const value = item[field];
      if (value === null || value === undefined) return false;

      if (typeof value === "string") {
        return value.toLowerCase().includes(term);
      }

      if (typeof value === "number") {
        return value.toString().includes(term);
      }

      return false;
    });
  });
}

// Combined Filter and Sort
export function createFilterAndSort<T>(params: CreateFilterAndSortParams<T>): T[] {
  const { data, searchTerm, sortField, sortDirection, filterFields, customFilter, getSortValue } = params;

  // If filterFields not provided, use all string/number fields from the first item
  const fieldsToFilter = filterFields || (data.length > 0 ?
    (Object.keys(data[0] as object) as (keyof T)[]).filter(key => {
      const value = data[0][key];
      return typeof value === "string" || typeof value === "number";
    }) : []);

  // Filter
  const filtered = filterData({
    data,
    config: {
      searchTerm,
      fields: fieldsToFilter,
      customFilter,
    },
  });

  // Sort - using local implementation
  return sortData({
    data: filtered,
    field: sortField,
    direction: sortDirection,
    getValue: getSortValue,
  });
}