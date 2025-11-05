"use client"

import { MyTokenCard } from "@/components/MyTokenCard";
import { TokenCardSkeleton } from "@/components/TokenCardSkeleton";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState, useCallback } from "react";
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

interface MyTokensClientProps {
  solPrice: number;
}

export default function MyTokensClient({ solPrice: initialSolPrice }: MyTokensClientProps) {
    const { publicKey } = useWallet();
    const router = useRouter()
    const [solPrice, setSolPrice] = useState<number>(initialSolPrice)
    const [portfolioValue, setPortfolioValue] = useState<number>(0)
    
    // Use the search hook with owner filter
    const {
        searchQuery,
        setSearchQuery,
        searchResults,
        isSearching,
        error: searchError,
        clearSearch
    } = useSearch({ 
        owner: publicKey?.toBase58(),
        debounceMs: 500 
    });

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
                        const priceData = calculateTokenPrice(poolState, solPrice);

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

    const sourceTokens = activeTab === 'created' ? listTokens : purchasedTokens;
    const displayTokens = searchQuery.trim() && !isSearching ? searchResults : sourceTokens;
    const displayError = searchQuery.trim() ? searchError : (activeTab === 'created' ? error : errorPurchased);
    
    const totalTokens = displayTokens?.length || 0;
    const tradingTokens = totalTokens;

    if (!publicKey) {
        return (
            <div className="min-h-screen py-10">
                <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-3xl font-bold text-black mb-2">My Portfolio</h1>
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                        <div className="w-64 h-64 mb-6 flex items-center justify-center">
                            <img src="/images/broken-pot.png" alt="Not Found" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Solana wallet not connected</h3>
                        <p className="text-gray-500 mb-6 max-w-md">
                            Connect your Solana wallet to view and manage your tokens.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (loading || loadingPurchased) {
        return (
            <div className="min-h-screen py-10 w-full">
                <div className="max-w-7xl mx-auto px-4 w-full">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-8">
                        <div className="max-w-md">
                            <h1 className="text-3xl font-bold text-black mb-3">My Portfolio</h1>
                            <p className="text-base text-gray-500 leading-6">
                                View and manage all the tokens you've created on the token launch platforms
                            </p>
                        </div>
                        <div className="flex md:flex-row flex-col gap-8 w-full">
                            <div className="bg-[#FAFAFA] border border-[#E2E8F0] rounded-xl p-6 md:w-80 w-full">
                                <div className="flex flex-col gap-10">
                                    <div>
                                        <h3 className="text-2xl font-bold text-[#09090B]">My Portfolio</h3>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <div className="text-3xl font-bold text-[#15803D]">
                                            $0.00
                                        </div>
                                        <div className="text-sm font-medium text-[#71717A]">
                                            Total portfolio value
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#FAFAFA] border border-[#E2E8F0] rounded-xl p-6 md:w-80 w-full">
                                <div className="flex flex-col gap-10">
                                    <div>
                                        <h3 className="text-2xl font-bold text-[#09090B]">Total Tokens</h3>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <div className="text-3xl font-bold text-[#15803D]">
                                            0
                                        </div>
                                        <div className="text-sm font-medium text-[#71717A]">
                                            (0 Trading)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 mb-8">
                        <div className="flex-1">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search your tokens..."
                                    disabled
                                    className="w-full px-3 py-2.5 bg-gray-100 border border-[#E2E8F0] rounded-md text-base font-medium text-gray-400 placeholder-gray-400 cursor-not-allowed"
                                />
                            </div>
                        </div>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild className="w-28">
                                <button
                                    disabled
                                    className="appearance-none px-4 py-2.5 bg-gray-100 border border-[#E2E8F0] rounded-md text-sm text-gray-400 cursor-not-allowed flex items-center justify-between w-28"
                                >
                                    <span>Filter</span>
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-20">
                                <DropdownMenuItem disabled>
                                    Filter
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <button disabled className="bg-gray-300 text-gray-500 px-9 py-2.5 rounded-md font-medium flex items-center justify-center">
                            Search
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-50">
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
            <div className="min-h-screen py-10">
                <div className="max-w-7xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-black mb-2">My Portfolio</h1>
                <p className="text-red-500 mb-8 text-base">{displayError}</p>
                </div>
            </div>
        );
    }

    if (listTokens.length === 0) {
        return (
            <div className="min-h-screen py-10">
                <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-3xl font-bold text-black mb-2">My Portfolio</h1>
                    
                    {searchQuery.trim() && isSearching ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-50">
                            {[...Array(6)].map((_, index) => (
                                <TokenCardSkeleton key={index} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
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
                                    className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
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
        <div className="min-h-screen py-10">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-8">
                    <div className="max-w-md md:max-w-full">
                        <h1 className="text-3xl font-bold text-black mb-3">My Portfolio</h1>
                        <p className="text-base text-gray-500 leading-6">
                            View and manage all the tokens you've created on the token launch platforms
                        </p>
                    </div>
                    <div className="flex md:flex-row flex-col gap-8 w-full">
                        <div className="bg-[#FAFAFA] border border-[#E2E8F0] rounded-xl p-6 md:w-80 w-full">
                            <div className="flex flex-col gap-10">
                                <div>
                                    <h3 className="text-2xl font-bold text-[#09090B]">My Portfolio</h3>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div className="text-3xl font-bold text-[#15803D]">
                                        ${formatNumberToCurrency(portfolioValue)}
                                    </div>
                                    <div className="text-sm font-medium text-[#71717A]">
                                        Total portfolio value
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#FAFAFA] border border-[#E2E8F0] rounded-xl p-6 md:w-80 w-full">
                            <div className="flex flex-col gap-10">
                                <div>
                                    <h3 className="text-2xl font-bold text-[#09090B]">Total Tokens</h3>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div className="text-3xl font-bold text-[#15803D]">
                                        {totalTokens}
                                    </div>
                                    <div className="text-sm font-medium text-[#71717A]">
                                        ({tradingTokens} Trading)
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 mb-4 border-b border-gray-200 w-full">
                    <button
                        onClick={() => setActiveTab('created')}
                        className={`px-6 py-3 ${activeTab === 'created' ? 'border-red-500 border-b-2 font-semibold' : 'border-none text-gray-500'} cursor-pointer`}
                    >
                        Created
                    </button>
                    <button
                        onClick={() => setActiveTab('purchased')}
                        className={`px-6 py-3 ${activeTab === 'purchased' ? 'border-red-500 border-b-2 font-semibold' : 'border-none text-gray-500'} cursor-pointer`}
                    >
                        Purchased
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mb-8">
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
                    
                    <div className="relative">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild className="w-28">
                                <button
                                    className="appearance-none flex flex-row gap-2 justify-between items-center px-3 py-3 w-28 bg-white border border-[#E2E8F0] rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <span>Filter</span>
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-40">
                                <DropdownMenuItem textValue="all" className="hover:bg-gray-100 cursor-pointer">
                                    Filter
                                </DropdownMenuItem>
                                <DropdownMenuItem textValue="trading" className="hover:bg-gray-100 cursor-pointer">
                                    Trading
                                </DropdownMenuItem>
                                <DropdownMenuItem textValue="presale" className="hover:bg-gray-100 cursor-pointer">
                                    Presale
                                </DropdownMenuItem>
                                <DropdownMenuItem textValue="ended" className="hover:bg-gray-100 cursor-pointer">
                                    Ended
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    
                    <button className="bg-[#DD3345] hover:bg-[#C02A3A] text-white px-9 py-2.5 rounded-md font-medium transition-colors duration-200 flex items-center justify-center">
                        Search
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-50">
                    {searchQuery.trim() && isSearching ? (
                        [...Array(6)].map((_, index) => (
                            <TokenCardSkeleton key={index} />
                        ))
                    ) : searchQuery.trim() && !isSearching && searchResults.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center text-center">
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
                                className="lg:max-w-[400px]"
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
