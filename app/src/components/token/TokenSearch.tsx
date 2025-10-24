"use client"

import { ChevronDown, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSearch } from "@/hooks/useSearch";
import { TokenCardSkeleton } from "@/components/TokenCardSkeleton";
import { NoTokensFound } from "@/components/NoTokensFound";
import ExploreTokenCard from "@/components/ExploreTokenCard";
import { Token } from "@/types/api";

interface TokenSearchProps {
  initialTokens: Token[];
}

export default function TokenSearch({ initialTokens }: TokenSearchProps) {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    clearSearch
  } = useSearch({ debounceMs: 500 });

  // Determine which tokens to display
  const displayTokens = searchQuery.trim() ? searchResults : initialTokens;

  return (
    <>
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
                <TokenCardSkeleton key={index} />
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
                key={token.id}
                className="lg:max-w-[400px]"
                id={token.id.toString()}
                mint={token.mintAddress}
                banner={token.metadata.bannerUri}
                avatar={token.metadata.tokenUri}
                name={token.name}
                symbol={token.symbol}
                description={token.description}
                decimals={token.decimals}
                totalSupply={token.totalSupply}
                actionButton={{
                  text: `Buy $${token.symbol}`,
                  variant: 'presale' as const
                }}
              />
            ))}
          </div>
        ) : initialTokens.length === 0 ? (
          <NoTokensFound 
            className="pt-10"
            width="180px" 
            height="180px"
            titleSize="text-[2.5rem]"
            subTitleSize="text-lg"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {initialTokens.map((token) => (
              <ExploreTokenCard  
                key={token.id}
                className="lg:max-w-[400px]"
                id={token.id.toString()}
                mint={token.mintAddress}
                banner={token.metadata.bannerUri}
                avatar={token.metadata.tokenUri}
                name={token.name}
                symbol={token.symbol}
                description={token.description}
                decimals={token.decimals}
                totalSupply={token.totalSupply}
                actionButton={{
                  text: `Buy $${token.symbol}`,
                  variant: 'presale' as const
                }}
              />
            ))}
          </div>
        )
      }
    </>
  );
}
