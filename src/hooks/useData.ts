import { useState, useEffect } from 'react';
import { getItem, subscribeToTable, STORE_KEYS } from '@/src/lib/storage';

export function useData<T>(storeKey: string, tableName?: string) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const result = await getItem<T>(storeKey);
        setData(result);
        setError(null);
      } catch (err) {
        console.error(`[v0] Error loading data for ${storeKey}:`, err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Subscribe to real-time updates if tableName is provided
    if (tableName) {
      const subscription = subscribeToTable<T>(tableName, setData);
      return () => subscription.unsubscribe();
    }
  }, [storeKey, tableName]);

  return { data, isLoading, error, refetch: () => getItem<T>(storeKey).then(setData) };
}
