import { useState, useEffect, useCallback } from 'react';

export function usePagination(initialPage = 1, initialLimit = 20) {
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const updatePagination = useCallback((newTotal: number, newTotalPages: number) => {
    setTotal(newTotal);
    setTotalPages(newTotalPages);
  }, []);

  const nextPage = () => setPage((p) => Math.min(p + 1, totalPages));
  const prevPage = () => setPage((p) => Math.max(p - 1, 1));
  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  return { page, limit, totalPages, total, updatePagination, nextPage, prevPage, goToPage, setPage };
}
