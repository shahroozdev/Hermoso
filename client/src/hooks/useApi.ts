import { useEffect, useRef, useState } from 'react';

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string;
}

export const useApi = <T>(fetcher: () => Promise<T>, deps: React.DependencyList = []): UseApiResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await fetcherRef.current();
        if (mounted) setData(result);
      } catch (err: unknown) {
        if (mounted) setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load data');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
};