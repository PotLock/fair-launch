import { useState, useEffect, useCallback } from 'react';
import { searchTokens } from '../lib/api';
import { Token } from '../types';

interface UseSearchOptions {
  owner?: string;
  debounceMs?: number;
}

interface UseSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Token[];
  isLoading: boolean;
  error: string | null;
  isSearching: boolean;
  clearSearch: () => void;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { owner, debounceMs = 300 } = options;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setError(null);

    try {
      const result = await searchTokens(query, owner);
      setSearchResults(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [owner]);

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

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isLoading,
    error,
    isSearching,
    clearSearch,
  };
}
