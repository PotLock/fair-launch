import { Token, Transaction } from '@/types/api';
import useSWR from 'swr';
import { API_URL } from '@/lib/api';

const fetcher = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};

export function useTransactions(address: string): {
    transactions: Transaction[];
    isLoading: boolean;
    error: Error | null;
} {
    const { data, error, isLoading } = useSWR(
        `${API_URL}/api/transactions/token/${address}`,
        fetcher,
        { refreshInterval: 1000 } // auto refetch every 1s
    );

    return {
        transactions: data?.transactions || data?.data || [],
        isLoading,
        error,
    };
}

type GetTokensOptions = {
    tag?: string;
    startDate?: string;
    endDate?: string;
};

export function useTokens(options?: GetTokensOptions): {
    tokens: Token[];
    isLoading: boolean;
    error: Error | null;
} {
    const params = new URLSearchParams({ launchpad: "potlaunch" });

    if (options?.tag) params.append("tag", options.tag);
    if (options?.startDate) params.append("startDate", options.startDate);
    if (options?.endDate) params.append("endDate", options.endDate);

    const url = `${API_URL}/api/tokens?${params}`;

    const { data, error, isLoading } = useSWR(url, fetcher, {
        refreshInterval: 10000,
        revalidateOnFocus: true
    });

    return {
        tokens: data?.tokens || data?.data || [],
        isLoading,
        error,
    };
}

export function useUserTokens(address?: string) {
    const shouldFetch = !!address;
    const { data, error, isLoading, mutate } = useSWR(
        shouldFetch ? `${API_URL}/api/tokens/address/${address}` : null,
        fetcher,
        {
            refreshInterval: 10000, 
            revalidateOnFocus: true
        }
    );

    return {
        tokens: data?.data || [],
        isLoading,
        error,
        refresh: mutate,
    };
}