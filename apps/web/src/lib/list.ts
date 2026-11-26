export type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function buildQuery(params: Record<string, string | number | boolean | null | undefined>) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    qs.set(key, String(value));
  }
  return qs.toString();
}

export function emptyPage<T>(page = 1, pageSize = 20): PageResult<T> {
  return { items: [], total: 0, page, pageSize, totalPages: 1 };
}
