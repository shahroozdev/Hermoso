import { useEffect, useState } from 'react';

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string;
}

export const useApi = <T>(fetcher: () => Promise<T>, deps: React.DependencyList = []): UseApiResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await fetcher();
        if (mounted) setData(result);
      } catch (err: any) {
        if (mounted) setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, deps);

  return { data, loading, error };
};