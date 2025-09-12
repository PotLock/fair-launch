import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MyTokenCard } from "../components/MyTokenCard";
import { MyTokenCardSkeleton } from "../components/MyTokenCardSkeleton";
import { WalletButton } from "../components/WalletButton";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState, useCallback } from "react";
import { getTokenByAddress } from "../lib/api";
import { ChevronDown, X } from "lucide-react";
import { Token } from "../types";
import { getPricingDisplay, getTemplateDisplay } from "../utils";
import { getSolPrice, getTokenBalanceOnSOL } from "../lib/sol";
import { PublicKey } from "@solana/web3.js";
import { getCurrentPriceSOL } from "../utils/sol";
import { getBondingCurveAccounts } from "../utils/token";
import { useMetadata } from "../hook/useMetadata";
import { useSearch } from "../hook/useSearch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { NoTokensFound } from "../components/NoTokensFound";

export const Route = createFileRoute("/my-tokens")({
    component: MyTokens,
});

function MyTokens() {
    const { publicKey } = useWallet();
    const navigate = useNavigate()
    const [listTokens, setListTokens] = useState<Token[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filterValue, setFilterValue] = useState("all");
    const [solPrice, setSolPrice] = useState<number>(0)
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

    useMetadata({
        title: "My Tokens - POTLAUNCH",
        description: "View and manage all the tokens you've created on POTLAUNCH. Track your portfolio value and token performance across multiple chains.",
        imageUrl: "/og-image.png"
    });

    const fetchTokens = useCallback(async () => {
        if (!publicKey) {
            setListTokens([]);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const tokens = await getTokenByAddress(publicKey.toBase58());
            setListTokens(tokens.data);

            let portfolio = 0;
            
            const portfolioCalculations = await Promise.all(
                tokens.data.map(async (token: Token) => {
                    try {
                        const balance = await getTokenBalanceOnSOL(token.mintAddress || '', publicKey.toBase58());
                        const bondingCurveAccounts = await getBondingCurveAccounts(new PublicKey(token.mintAddress));
                        const currentPrice = getCurrentPriceSOL(
                            BigInt(bondingCurveAccounts?.reserveBalance || 0),
                            BigInt(bondingCurveAccounts?.reserveToken || 0)
                        );
                        return balance * currentPrice * solPrice;
                    } catch (error) {
                        console.error(`Error calculating portfolio for token ${token.mintAddress}:`, error);
                        return 0;
                    }
                })
            );
            
            portfolio = portfolioCalculations.reduce((sum, value) => sum + value, 0);
            setPortfolioValue(portfolio);

        } catch (err) {
            setError('Failed to fetch token balances');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [publicKey, solPrice]);

    const fetchSolPrice = useCallback(async () => {
        const solPrice = await getSolPrice()
        setSolPrice(solPrice || 0)
    },[])   

    useEffect(() => {
        fetchSolPrice();
    }, [fetchSolPrice]);

    useEffect(() => {
        if (solPrice > 0) {
            fetchTokens();
        }
    }, [fetchTokens, solPrice]);

    // Determine which tokens to display
    const displayTokens = searchQuery.trim() && !isSearching ? searchResults : listTokens;
    const displayError = searchQuery.trim() ? searchError : error;
    
    // Calculate portfolio statistics
    const totalTokens = displayTokens.length;
    // For now, assuming all tokens are trading since there's no status field
    const tradingTokens = totalTokens;

    if (!publicKey) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] py-10">
                <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-3xl font-bold text-black mb-2">My portfolio</h1>
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                        <div className="w-32 h-32 mb-6 flex items-center justify-center">
                            <svg
                                className="w-full h-full text-gray-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Wallet not connected</h3>
                        <p className="text-gray-500 mb-6 max-w-md">
                            Connect your wallet to view and manage your tokens
                        </p>
                        <WalletButton />
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen py-10">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-8">
                        <div className="flex-1 max-w-md">
                            <h1 className="text-3xl font-bold text-black mb-3">My Tokens</h1>
                            <p className="text-base text-gray-500 leading-6">
                                View and manage all the tokens you’ve created on the token launch platforms
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
                            <MyTokenCardSkeleton key={index} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (displayError) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] py-10">
                <div className="max-w-7xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-black mb-2">My Tokens</h1>
                <p className="text-red-500 mb-8 text-base">{displayError}</p>
                </div>
            </div>
        );
    }

    if (listTokens.length === 0) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] py-10">
                <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-3xl font-bold text-black mb-2">My Tokens</h1>
                    
                    {searchQuery.trim() && isSearching ? (
                        // Show skeleton when searching
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-50">
                            {[...Array(6)].map((_, index) => (
                                <MyTokenCardSkeleton key={index} />
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
                            {!searchQuery.trim() && (
                                <button
                                    onClick={()=>navigate({to: "/create"})}
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
                    <div className="flex-1 max-w-md">
                        <h1 className="text-3xl font-bold text-black mb-3">My Tokens</h1>
                        <p className="text-base text-gray-500 leading-6">
                            View and manage all the tokens you’ve created on the token launch platforms
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
                                        ${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                        // Show skeleton when searching
                        [...Array(6)].map((_, index) => (
                            <MyTokenCardSkeleton key={index} />
                        ))
                    ) : searchQuery.trim() && !isSearching && searchResults.length === 0 ? (
                        // Show NoTokensFound when search has no results
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
                        displayTokens.map((token) => (
                            <MyTokenCard  
                                className="lg:max-w-[400px]"
                                id={token.id.toString()}
                                user={publicKey}
                                mint={token.mintAddress || ''}
                                banner={token.bannerUrl || ''}
                                avatar={token.avatarUrl || ''}
                                name={token.name}
                                symbol={token.symbol}
                                type={getPricingDisplay(token.selectedPricing || '')}
                                description={token.description}
                                decimals={token.decimals}
                                template={getTemplateDisplay(token.selectedTemplate)}
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