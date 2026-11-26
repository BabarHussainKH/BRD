export type PageParams = {
  page?: number;
  pageSize?: number;
};

export function normalizePage(params: PageParams, maxPageSize = 100) {
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(maxPageSize, Math.max(1, Number(params.pageSize) || 20));
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function pageResult<T>(items: T[], total: number, page: number, pageSize: number) {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / Math.max(1, pageSize))),
  };
}
