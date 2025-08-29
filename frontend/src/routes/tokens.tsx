import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { TokenInfo } from "../utils/token";
import { getTokens } from "../lib/api";
import { getPricingDisplay } from "../utils";
import ExploreTokenCard from "../components/ExploreTokenCard";
import { useMetadata } from "../hook/useMetadata";
import { useSearch } from "../hook/useSearch";
import { ChevronDown,  X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { MyTokenCardSkeleton } from "../components/MyTokenCardSkeleton";
import { NoTokensFound } from "../components/NoTokensFound";

export const Route = createFileRoute("/tokens")({
    component: Tokens,
});

function Tokens() {
    const [tokens, setTokens] = useState<TokenInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterValue, setFilterValue] = useState("all");
    
    // Use the search hook
    const {
        searchQuery,
        setSearchQuery,
        searchResults,
        isSearching,
        clearSearch
    } = useSearch({ debounceMs: 500 });

    useMetadata({
        title: "Launchpad - POTLAUNCH",
        description: "Discover and participate in token launches on POTLAUNCH. Support projects you believe in with our comprehensive token launch platform.",
        imageUrl: "/og-image.png"
    });

    useEffect(() => {
        const fetchTokens = async () => {
          try {
            setLoading(true);
            setError(null);
            const tokens = await getTokens();
            setTokens(tokens.data);
          } catch (error) {
            console.error('Error fetching tokens:', error);
            setError('Failed to load tokens. Please try again later.');
          } finally {
            setLoading(false);
          }
        };
    
        fetchTokens();
    }, []);

    // Determine which tokens to display
    const displayTokens = searchQuery.trim() ? searchResults : tokens;

    if (loading) {
        return (
            <div className="min-h-screen py-10">
                <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-3xl font-bold text-black mb-2">Token Launchpad</h1>
                    <p className="text-gray-500 mb-8 text-base">
                        Discover and participate in token launches. Support projects you believe in.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 mb-8">
                        <div className="flex-1">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search"
                                    className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-md text-base font-medium text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
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
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        
                        <button className="bg-[#DD3345] hover:bg-[#C02A3A] text-white px-9 py-2.5 rounded-md font-medium transition-colors duration-200 flex items-center justify-center">
                            Search
                        </button>
                    </div>
                    {tokens.length === 0 ? (
                        <NoTokensFound />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[...Array(6)].map((_, index) => (
                                <MyTokenCardSkeleton key={index} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="min-h-screen py-10">
                <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-3xl font-bold text-black mb-2">Token Launchpad</h1>
                    <p className="text-gray-500 mb-8 text-base">
                        Discover and participate in token launches. Support projects you believe in.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 mb-8">
                        <div className="flex-1">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search"
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
                    <NoTokensFound 
                        className="pt-10"
                        width="180px" 
                        height="180px"
                        titleSize="text-[2.5rem]"
                        subTitleSize="text-lg"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-10">
            <div className="max-w-7xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-black mb-2">Token Launchpad</h1>
                <p className="text-gray-500 mb-8 text-base">
                    Discover and participate in token launches. Support projects you believe in.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 mb-8">
                    <div className="flex-1">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search"
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
                            <DropdownMenuContent className="w-40 bg-white">
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
                
                {
                    isSearching ? (
                        <div className="text-center">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {[...Array(6)].map((_, index) => (
                                    <MyTokenCardSkeleton key={index} />
                                ))}
                            </div>
                        </div>
                    ) : searchQuery.trim() && displayTokens.length === 0 ? (
                        <NoTokensFound 
                            searchQuery={searchQuery} 
                            className="pt-10"
                            width="170px" 
                            height="170px"
                            titleSize="text-[2rem]"
                            subTitleSize="text-base"
                        />
                    ) : displayTokens.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {displayTokens.map((token) => (
                                <ExploreTokenCard  
                                    className="lg:max-w-[400px]"
                                    id={token.id.toString()}
                                    mint={token.mintAddress || ''}
                                    banner={token.bannerUrl || ''}
                                    avatar={token.avatarUrl || ''}
                                    name={token.name}
                                    symbol={token.symbol}
                                    type={getPricingDisplay(token.selectedPricing || '')}
                                    description={token.description}
                                    decimals={token.decimals}
                                    status={'Trading'}
                                    actionButton={{
                                        text: `Buy $${token.symbol}`,
                                        variant: 'presale' as const
                                    }}
                                />
                            ))}
                        </div>
                    ) : null
                }
            </div>
        </div>
    )
}