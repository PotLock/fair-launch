"use client"

import { MyTokenCard } from "@/components/MyTokenCard";
import { TokenCardSkeleton } from "@/components/TokenCardSkeleton";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { ChevronDown, X } from "lucide-react";
import { Token } from "@/types/api";
import { getSolPrice, getTokenBalanceOnSOL } from "@/lib/sol";
import { useSearch } from "@/hooks/useSearch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NoTokensFound } from "@/components/NoTokensFound";
import { useRouter } from "next/navigation";
import { useUserTokens, usePurchasedTokens } from "@/hooks/useSWR";
import { getPoolStateByMint } from "@/lib/api";
import { calculateTokenPrice, formatNumberToCurrency } from "@/utils";
import { TAG_ICONS, TAG_OPTIONS } from "@/components/modal/TagsSelectModal";

interface MyTokensClientProps {
    solPrice: number;
}

type TimeRangeType = "all" | "24h" | "7d" | "30d" | "90d" | "custom";

export default function MyTokensClient({ solPrice: initialSolPrice }: MyTokensClientProps) {
    const { publicKey } = useWallet();
    const router = useRouter()
    const [solPrice, setSolPrice] = useState<number>(initialSolPrice)
    const [portfolioValue, setPortfolioValue] = useState<number>(0)
    const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRangeType>("all");
    
    // Use the search hook with owner filter
    const {
        searchQuery,
        setSearchQuery,
        searchResults,
        isSearching,
        error: searchError,
        tag,
        setTag,
        timeRange,
        setTimeRange,
        clearSearch,
        clearFilters: clearSearchFilters
    } = useSearch({ 
        owner: publicKey?.toBase58(),
        debounceMs: 500 
    });

    const handleTimeRangeChange = useCallback((range: TimeRangeType) => {
        setSelectedTimeRange(range);

        if (range === "all") {
            setTimeRange(undefined);
        } else {
            const date = new Date();
            if (range === "24h") {
                date.setHours(date.getHours() - 24);
            } else if (range === "7d") {
                date.setDate(date.getDate() - 7);
            } else if (range === "30d") {
                date.setDate(date.getDate() - 30);
            } else if (range === "90d") {
                date.setDate(date.getDate() - 90);
            }
            setTimeRange(date.toISOString());
        }
    }, [setTimeRange]);

    const handleTagChange = useCallback((selectedTag: string) => {
        if (tag === selectedTag) {
            setTag(undefined);
        } else {
            setTag(selectedTag);
        }
    }, [tag, setTag]);

    const getTimeRangeLabel = useCallback((range: TimeRangeType): string => {
        switch (range) {
            case "24h":
                return "24 Hours";
            case "7d":
                return "7 Days";
            case "30d":
                return "30 Days";
            case "90d":
                return "90 Days";
            case "custom":
                return "Custom";
            default:
                return "All Time";
        }
    }, []);

    const handleClearFilters = useCallback(() => {
        setSelectedTimeRange("all");
        setTag(undefined);
        setTimeRange(undefined);
        clearSearchFilters();
    }, [clearSearchFilters, setTag, setTimeRange]);

    const fetchSolPrice = useCallback(async () => {
        const solPrice = await getSolPrice()
        setSolPrice(solPrice || 0)
    },[])

    const { tokens: listTokens, isLoading: loading, error, refresh: refreshTokens } = useUserTokens(publicKey?.toBase58());
    const { tokens: purchasedTokens, isLoading: loadingPurchased, error: errorPurchased } = usePurchasedTokens(publicKey?.toBase58());

    const [activeTab, setActiveTab] = useState<'created' | 'purchased'>('created');

    // Calculate portfolio value
    const calculatePortfolioValue = useCallback(async () => {
        if (!publicKey || !solPrice) return;

        try {
            const allTokens = [...listTokens, ...purchasedTokens];
            let totalValue = 0;

            for (const token of allTokens) {
                try {
                    // Get user's balance
                    const balance = await getTokenBalanceOnSOL(token.mintAddress, publicKey.toBase58());

                    if (balance > 0) {
                        // Get current price
                        const poolState = await getPoolStateByMint(token.mintAddress);
                        const priceData = calculateTokenPrice(poolState, token.decimals, solPrice);

                        // Calculate value
                        const tokenValue = balance * priceData.priceInUsd;
                        totalValue += tokenValue;
                    }
                } catch (error) {
                    console.error(`Error calculating value for token ${token.mintAddress}:`, error);
                }
            }

            setPortfolioValue(totalValue);
        } catch (error) {
            console.error('Error calculating portfolio value:', error);
        }
    }, [publicKey, solPrice, listTokens, purchasedTokens]);

    useEffect(() => {
        fetchSolPrice();
    }, [fetchSolPrice]);

    useEffect(() => {
        if (listTokens.length > 0 || purchasedTokens.length > 0) {
            calculatePortfolioValue();
        }
    }, [listTokens, purchasedTokens, calculatePortfolioValue]);

    const sourceTokens = useMemo(() => (
        activeTab === 'created' ? listTokens : purchasedTokens
    ), [activeTab, listTokens, purchasedTokens]);

    const filteredTokens = useMemo(() => {
        let filtered = [...sourceTokens];

        if (tag) {
            filtered = filtered.filter(token =>
                token.tags && token.tags.some((t: string) => t.toLowerCase() === tag.toLowerCase())
            );
        }

        if (timeRange) {
            const filterDate = new Date(timeRange);
            filtered = filtered.filter((token: Token) => {
                const tokenDate = new Date(token.createdAt);
                return tokenDate.getTime() >= filterDate.getTime();
            });
        }

        return filtered;
    }, [sourceTokens, tag, timeRange]);

    const filteredSearchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];

        let filtered = [...searchResults];

        if (timeRange) {
            const filterDate = new Date(timeRange);
            filtered = filtered.filter(token => {
                const tokenDate = new Date(token.createdAt);
                return tokenDate.getTime() >= filterDate.getTime();
            });
        }

        return filtered;
    }, [searchResults, timeRange, searchQuery]);

    const displayTokens = searchQuery.trim() && !isSearching ? filteredSearchResults : filteredTokens;
    const displayError = searchQuery.trim() ? searchError : (activeTab === 'created' ? error : errorPurchased);
    
    const totalTokens = displayTokens.length;
    const tradingTokens = totalTokens;

    if (!publicKey) {
        return (
            <div className="min-h-screen py-6 md:py-10">
                <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-black mb-2">My Portfolio</h1>
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                        <div className="w-48 h-48 md:w-64 md:h-64 mb-6 flex items-center justify-center">
                            <img src="/images/broken-pot.png" alt="Not Found" />
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">Solana wallet not connected</h3>
                        <p className="text-sm md:text-base text-gray-500 mb-6 max-w-md px-4">
                            Connect your Solana wallet to view and manage your tokens.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (loading || loadingPurchased) {
        return (
            <div className="min-h-screen py-6 md:py-10 w-full">
                <div className="max-w-7xl mx-auto px-4 w-full">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4 md:gap-8 mb-6 md:mb-8">
                        <div className="max-w-md w-full lg:w-auto">
                            <h1 className="text-2xl md:text-3xl font-bold text-black mb-2 md:mb-3">My Portfolio</h1>
                            <p className="text-sm md:text-base text-gray-500 leading-6">
                                View and manage all the tokens you've created on the token launch platforms
                            </p>
                        </div>
                        <div className="flex md:flex-row flex-col gap-4 md:gap-8 w-full lg:w-auto">
                            <div className="bg-[#FAFAFA] border border-[#E2E8F0] rounded-xl p-4 md:p-6 md:w-80 w-full">
                                <div className="flex flex-col gap-6 md:gap-10">
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-bold text-[#09090B]">My Portfolio</h3>
                                    </div>
                                    <div className="flex flex-col gap-2 md:gap-3">
                                        <div className="text-2xl md:text-3xl font-bold text-[#15803D]">
                                            $0.00
                                        </div>
                                        <div className="text-xs md:text-sm font-medium text-[#71717A]">
                                            Total portfolio value
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#FAFAFA] border border-[#E2E8F0] rounded-xl p-4 md:p-6 md:w-80 w-full">
                                <div className="flex flex-col gap-6 md:gap-10">
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-bold text-[#09090B]">Total Tokens</h3>
                                    </div>
                                    <div className="flex flex-col gap-2 md:gap-3">
                                        <div className="text-2xl md:text-3xl font-bold text-[#15803D]">
                                            0
                                        </div>
                                        <div className="text-xs md:text-sm font-medium text-[#71717A]">
                                            (0 Trading)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 mb-6 md:mb-8">
                        <div className="flex-1">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search your tokens..."
                                    disabled
                                    className="w-full px-3 py-2.5 bg-gray-100 border border-[#E2E8F0] rounded-md text-sm md:text-base font-medium text-gray-400 placeholder-gray-400 cursor-not-allowed"
                                />
                            </div>
                        </div>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild className="w-full sm:w-28">
                                <button
                                    disabled
                                    className="appearance-none px-4 py-2.5 bg-gray-100 border border-[#E2E8F0] rounded-md text-xs sm:text-sm text-gray-400 cursor-not-allowed flex items-center justify-between w-full sm:w-28"
                                >
                                    <span>Filter</span>
                                    <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-20">
                                <DropdownMenuItem disabled>
                                    Filter
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <button disabled className="bg-gray-300 text-gray-500 px-6 sm:px-9 py-2.5 rounded-md text-sm font-medium flex items-center justify-center w-full sm:w-auto">
                            Search
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 pb-50">
                        {[...Array(6)].map((_, index) => (
                            <TokenCardSkeleton key={index} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (displayError) {
        return (
            <div className="min-h-screen py-6 md:py-10">
                <div className="max-w-7xl mx-auto px-4">
                <h1 className="text-2xl md:text-3xl font-bold text-black mb-2">My Portfolio</h1>
                <p className="text-red-500 mb-8 text-sm md:text-base">{displayError}</p>
                </div>
            </div>
        );
    }

    if (listTokens.length === 0) {
        return (
            <div className="min-h-screen py-6 md:py-10">
                <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-black mb-2">My Portfolio</h1>
                    
                    {searchQuery.trim() && isSearching ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 pb-50">
                            {[...Array(6)].map((_, index) => (
                                <TokenCardSkeleton key={index} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                            <NoTokensFound 
                                searchQuery={searchQuery} 
                                className="pt-10"
                                width="170px" 
                                height="170px"
                                titleSize="text-[2rem]"
                                subTitleSize="text-base"
                            />
                            {!searchQuery.trim() && activeTab === 'created' && (
                                <button
                                    onClick={()=>router.push("/create")}
                                    className="bg-black hover:bg-gray-800 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors duration-200"
                                >
                                    Create Your First Token
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-6 md:py-10">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4 md:gap-8 mb-6 md:mb-8">
                    <div className="max-w-md w-full lg:w-auto">
                        <h1 className="text-2xl md:text-3xl font-bold text-black mb-2 md:mb-3">My Portfolio</h1>
                        <p className="text-sm md:text-base text-gray-500 leading-6">
                            View and manage all the tokens you've created on the token launch platforms
                        </p>
                    </div>
                    <div className="flex md:flex-row flex-col gap-4 md:gap-8 w-full lg:w-auto">
                        <div className="bg-[#FAFAFA] border border-[#E2E8F0] rounded-xl p-4 md:p-6 md:w-80 w-full">
                            <div className="flex flex-col gap-6 md:gap-10">
                                <div>
                                    <h3 className="text-xl md:text-2xl font-bold text-[#09090B]">My Portfolio</h3>
                                </div>
                                <div className="flex flex-col gap-2 md:gap-3">
                                    <div className="text-2xl md:text-3xl font-bold text-[#15803D]">
                                        ${formatNumberToCurrency(portfolioValue)}
                                    </div>
                                    <div className="text-xs md:text-sm font-medium text-[#71717A]">
                                        Total portfolio value
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#FAFAFA] border border-[#E2E8F0] rounded-xl p-4 md:p-6 md:w-80 w-full">
                            <div className="flex flex-col gap-6 md:gap-10">
                                <div>
                                    <h3 className="text-xl md:text-2xl font-bold text-[#09090B]">Total Tokens</h3>
                                </div>
                                <div className="flex flex-col gap-2 md:gap-3">
                                    <div className="text-2xl md:text-3xl font-bold text-[#15803D]">
                                        {totalTokens}
                                    </div>
                                    <div className="text-xs md:text-sm font-medium text-[#71717A]">
                                        ({tradingTokens} Trading)
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 sm:gap-2 mb-4 border-b border-gray-200 w-full overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('created')}
                        className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base ${activeTab === 'created' ? 'border-red-500 border-b-2 font-semibold' : 'border-none text-gray-500'} cursor-pointer whitespace-nowrap`}
                    >
                        Created
                    </button>
                    <button
                        onClick={() => setActiveTab('purchased')}
                        className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base ${activeTab === 'purchased' ? 'border-red-500 border-b-2 font-semibold' : 'border-none text-gray-500'} cursor-pointer whitespace-nowrap`}
                    >
                        Purchased
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <div className="flex-1">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search your tokens..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-md text-base font-medium text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {searchQuery && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            {isSearching && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild className="w-full sm:w-36 cursor-pointer">
                                    <button
                                        className="appearance-none flex flex-row gap-2 justify-between items-center px-3 py-2.5 sm:py-3 w-full sm:w-36 bg-white border border-[#E2E8F0] rounded-md text-xs sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <span className="truncate">{getTimeRangeLabel(selectedTimeRange)}</span>
                                        <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 shrink-0" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-40 bg-white">
                                    <DropdownMenuItem
                                        textValue="all"
                                        className="hover:bg-gray-100 cursor-pointer"
                                        onClick={() => handleTimeRangeChange("all")}
                                    >
                                        All Time
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        textValue="24h"
                                        className="hover:bg-gray-100 cursor-pointer"
                                        onClick={() => handleTimeRangeChange("24h")}
                                    >
                                        24 Hours
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        textValue="7d"
                                        className="hover:bg-gray-100 cursor-pointer"
                                        onClick={() => handleTimeRangeChange("7d")}
                                    >
                                        7 Days
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        textValue="30d"
                                        className="hover:bg-gray-100 cursor-pointer"
                                        onClick={() => handleTimeRangeChange("30d")}
                                    >
                                        30 Days
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        textValue="90d"
                                        className="hover:bg-gray-100 cursor-pointer"
                                        onClick={() => handleTimeRangeChange("90d")}
                                    >
                                        90 Days
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="relative flex-1 sm:flex-none">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild className="w-full sm:w-36 cursor-pointer">
                                    <button
                                        className="appearance-none flex flex-row gap-2 justify-between items-center px-3 py-2.5 sm:py-3 w-full sm:w-36 bg-white border border-[#E2E8F0] rounded-md text-xs sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <span className="capitalize truncate">
                                            {tag ? `${TAG_ICONS[tag] ?? ""} ${tag}` : "Tags"}
                                        </span>
                                        <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 shrink-0" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-48 bg-white">
                                    {TAG_OPTIONS.map((option) => (
                                        <DropdownMenuItem
                                            key={option}
                                            textValue={option}
                                            className={`hover:bg-gray-100 cursor-pointer ${tag === option ? "bg-blue-50" : ""}`}
                                            onClick={() => handleTagChange(option)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>{TAG_ICONS[option]}</span>
                                                <span className="capitalize">{option}</span>
                                            </div>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                {(selectedTimeRange !== "all" || tag) && (
                    <div className="flex flex-wrap items-center gap-2 mb-4 md:mb-6">
                        {selectedTimeRange !== "all" && (
                            <button
                                onClick={() => handleTimeRangeChange("all")}
                                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-blue-100 bg-blue-50 px-2.5 sm:px-3 py-1 text-xs sm:text-sm text-blue-700 transition hover:bg-blue-100 cursor-pointer"
                            >
                                <span>{getTimeRangeLabel(selectedTimeRange)}</span>
                                <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </button>
                        )}
                        {tag && (
                            <button
                                onClick={() => setTag(undefined)}
                                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-blue-100 bg-blue-50 px-2.5 sm:px-3 py-1 text-xs sm:text-sm text-blue-700 transition hover:bg-blue-100 cursor-pointer"
                            >
                                <span className="capitalize flex items-center gap-1 sm:gap-2">
                                    <span>{TAG_ICONS[tag]}</span>
                                    <span>{tag}</span>
                                </span>
                                <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </button>
                        )}
                        <button
                            onClick={handleClearFilters}
                            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-gray-200 bg-white px-2.5 sm:px-3 py-1 text-xs sm:text-sm text-gray-600 transition hover:bg-gray-100 cursor-pointer"
                        >
                            Clear all
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 pb-50">
                    {searchQuery.trim() && isSearching ? (
                        [...Array(6)].map((_, index) => (
                            <TokenCardSkeleton key={index} />
                        ))
                    ) : searchQuery.trim() && !isSearching && searchResults.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center text-center px-4">
                            <NoTokensFound 
                                searchQuery={searchQuery} 
                                className="pt-3"
                                width="170px" 
                                height="170px"
                                titleSize="text-[2rem]"
                                subTitleSize="text-base"
                            />
                        </div>
                    ) : (
                        displayTokens?.map((token: Token) => (
                            <MyTokenCard  
                                key={token.id.toString()}
                                className="w-full lg:max-w-[400px]"
                                id={token.id.toString()}
                                user={publicKey}
                                mint={token.mintAddress || ''}
                                banner={token.metadata.bannerUri || ''}
                                avatar={token.metadata.tokenUri || ''}
                                name={token.name}
                                symbol={token.symbol}
                                description={token.description || ''}
                                decimals={parseFloat(token.decimals.toString())}
                                solPrice={solPrice}
                                actionButton={{
                                    text: `Buy $${token.symbol}`,
                                    variant: 'presale' as const
                                }}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
