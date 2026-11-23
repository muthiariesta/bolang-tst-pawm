import { useCallback, useEffect, useRef, useState } from 'react';

// Mengelola tiga kondisi wajib (Modul 7): loading, error, sukses.
// fetcher: fungsi async tanpa argumen. deps: kapan data diambil ulang.
//   const { data, loading, error, refetch } = useApi(() => getPlaces(), []);
export default function useApi(fetcher, deps = [], { immediate = true, initialData = null } = {}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate && initialData == null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const mounted = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      if (mounted.current) setData(result);
      return result;
    } catch (e) {
      if (mounted.current) setError(e);
      return undefined;
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    if (immediate) run({ silent: data != null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refetch = useCallback(() => run({ silent: true }), [run]);

  return { data, setData, loading, refreshing, error, refetch, reload: run };
}
