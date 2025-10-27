import { useState, useEffect, useCallback } from 'react';
import { searchTokens } from '../lib/api';
import { Token } from '@/types/api';

interface UseSearchOptions {
  owner?: string;
  tag?: string;
  debounceMs?: number;
}

interface UseSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Token[];
  error: string | null;
  isSearching: boolean;
  tag: string | undefined;
  setTag: (tag: string | undefined) => void;
  timeRange: string | undefined;
  setTimeRange: (range: string | undefined) => void;
  clearSearch: () => void;
  clearFilters: () => void;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { owner, debounceMs = 300 } = options;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Token[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [tag, setTag] = useState<string | undefined>(undefined);
  const [timeRange, setTimeRange] = useState<string | undefined>(undefined);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setError(null);

    try {
      const result = await searchTokens(query, { 
        owner, 
        tag,
        startDate: timeRange 
      });
      setSearchResults(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [owner, tag, timeRange]);

  // Debounced search effect
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }

    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch, debounceMs]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
    setIsSearching(false);
  }, []);

  const clearFilters = useCallback(() => {
    setTag(undefined);
    setTimeRange(undefined);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    error,
    isSearching,
    tag,
    setTag,
    timeRange,
    setTimeRange,
    clearSearch,
    clearFilters,
  };
}
