"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { getToken } from "./auth";

export function useApiData<T>(path: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const res = await api<T>(path, { token });
      setData(res);
    } catch (e) {
      setError((e as { message?: string }).message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}
