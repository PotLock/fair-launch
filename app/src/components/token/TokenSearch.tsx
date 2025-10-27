"use client"

import { ChevronDown, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSearch } from "@/hooks/useSearch";
import { TokenCardSkeleton } from "@/components/TokenCardSkeleton";
import { NoTokensFound } from "@/components/NoTokensFound";
import ExploreTokenCard from "@/components/ExploreTokenCard";
import { Token } from "@/types/api";
import { useState, useMemo } from "react";
import { TAG_OPTIONS, TAG_ICONS } from "@/components/modal/TagsSelectModal";
import { useTokens } from "@/hooks/useSWR";



type TimeRangeType = "all" | "24h" | "7d" | "30d" | "90d" | "custom";

export default function TokenSearch() {
  const { tokens, isLoading, error } = useTokens();
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    tag,
    setTag,
    timeRange,
    setTimeRange,
    clearSearch,
    clearFilters
  } = useSearch({ debounceMs: 500 });

  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRangeType>("all");

  const handleTimeRangeChange = (range: TimeRangeType) => {
    setSelectedTimeRange(range);
    
    if (range === "all") {
      setTimeRange(undefined);
    } else if (range === "24h") {
      const date = new Date();
      date.setHours(date.getHours() - 24);
      setTimeRange(date.toISOString());
    } else if (range === "7d") {
      const date = new Date();
      date.setDate(date.getDate() - 7);
      setTimeRange(date.toISOString());
    } else if (range === "30d") {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      setTimeRange(date.toISOString());
    } else if (range === "90d") {
      const date = new Date();
      date.setDate(date.getDate() - 90);
      setTimeRange(date.toISOString());
    }
  };

  const handleTagChange = (selectedTag: string) => {
    if (tag === selectedTag) {
      setTag(undefined);
    } else {
      setTag(selectedTag);
    }
  };

  const getTimeRangeLabel = (range: TimeRangeType): string => {
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
  };

  const getFilteredTokens = useMemo(() => {
    let filtered = [...tokens];

    if (tag) {
      filtered = filtered.filter(token => 
        token.tags && token.tags.some(t => t.toLowerCase() === tag.toLowerCase())
      );
    }

    if (timeRange) {
      const filterDate = new Date(timeRange);
      filtered = filtered.filter(token => {
        const tokenDate = new Date(token.createdAt);
        return tokenDate.getTime() >= filterDate.getTime();
      });
    }

    return filtered;
  }, [tokens, tag, timeRange, selectedTimeRange]);

  const getFilteredSearchResults = useMemo(() => {
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
  }, [searchResults, timeRange, searchQuery, selectedTimeRange]);

  const displayTokens = searchQuery.trim() ? getFilteredSearchResults : getFilteredTokens;

  return (
    <>
      <div className="flex flex-col gap-4 mb-8">
        {/* Search and Filters Row */}
        <div className="flex flex-col sm:flex-row gap-2">
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
          
          <div className="flex gap-2">
            {/* Time Range Filter */}
            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="w-36">
                  <button
                    className="appearance-none flex flex-row gap-2 justify-between items-center px-3 py-3 w-36 bg-white border border-[#E2E8F0] rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <span>{getTimeRangeLabel(selectedTimeRange)}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
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
            
            {/* Tags Filter */}
            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="w-36">
                  <button
                    className="appearance-none flex flex-row gap-2 justify-between items-center px-3 py-3 w-36 bg-white border border-[#E2E8F0] rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <span className="capitalize">{tag ? TAG_ICONS[tag] + ' ' + tag : 'Tags'}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 bg-white">
                  {TAG_OPTIONS.map((option) => (
                    <DropdownMenuItem 
                      key={option}
                      textValue={option} 
                      className={`hover:bg-gray-100 cursor-pointer ${tag === option ? 'bg-blue-50' : ''}`}
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
      </div>
      
      {
        isSearching || isLoading ? (
          <div className="text-center">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, index) => (
                <TokenCardSkeleton key={index} />
              ))}
            </div>
          </div>
        ) : displayTokens.length === 0 ? (
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
        ) : null
      }
    </>
  );
}
