import { useQuery } from '@tanstack/react-query';

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string;
}

type ApiError = Error & { response?: { data?: { message?: string } } };

export const useApi = <T>(fetcher: () => Promise<T>, deps: React.DependencyList = []): UseApiResult<T> => {
  // Filter out undefined, null, and empty string values from dependencies
  const queryKey = deps.filter((dep) => dep !== undefined && dep !== null && dep !== '');

  const { data, isLoading, error } = useQuery<T, ApiError>({
    queryKey,
    queryFn: fetcher,
  });

  return {
    data: data ?? null,
    loading: isLoading,
    error: error?.response?.data?.message || error?.message || '',
  };
};
