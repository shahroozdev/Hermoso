import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useInvalidate = () => {
  const queryClient = useQueryClient();

  const invalidate = useCallback((queryKey?: string[]) => {
    console.log("invalidate called with queryKey:", queryKey);
    if (queryKey) {
      // Invalidate all queries that start with the provided queryKey
      return queryClient.invalidateQueries({ queryKey });
    }
    // If no queryKey provided, invalidate all queries
    return queryClient.invalidateQueries();
  }, [queryClient]);

  return invalidate;
};
