import { Suspense } from "react";
import ExploreTokenCard from "../ExploreTokenCard";
import ExploreTokensLoading from "./ExploreTokensLoading";
import { getTokens } from "@/lib/api";
import { Token } from "@/types/api";

async function ExploreTokensContent() {
  try {
    const response = await getTokens();
    const tokens: Token[] = response.data || [];

    if (tokens.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Tokens Available</h3>
            <p className="text-gray-600 mb-4">There are currently no tokens to display.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex gap-3">
        {tokens.slice(0, 3).map((token) => (
          <div key={token.id} className="flex-shrink-0 ex-card p-2" style={{ width: `calc((100% - 0.6rem) / 3)` }}>
            <ExploreTokenCard  
              id={token.id.toString()}
              mint={token.mintAddress}
              totalSupply={token.totalSupply}
              banner={token.metadata.bannerUri}
              avatar={token.metadata.tokenUri}
              name={token.name}
              symbol={token.symbol}
              description={token.description}
              decimals={token.decimals}
              actionButton={{
                text: `Buy $${token.symbol}`,
                variant: 'presale' as const
              }}
            />
          </div>
        ))}
      </div>
    );
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Failed to Load Tokens</h3>
          <p className="text-gray-600 mb-4">Unable to fetch token data. Please try again later.</p>
        </div>
      </div>
    );
  }
}

function ExploreTokensControls() {
  return (
    <div className="flex flex-row justify-between items-center mt-8 gap-4">
      <a 
        href="/token" 
        className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
      >
        <span className="text-sm">Explore All</span>
      </a>
      
      <div className='flex justify-center'>
        <div className="border border-black max-w-[200px] flex rounded-full">
          <button
            className="h-8 md:h-10 w-8 md:w-12 p-2 border-r border-black hover:bg-gray-100 rounded-l-full flex items-center justify-center transition-colors shadow-sm"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            className="h-8 md:h-10 w-8 md:w-12 p-2 flex items-center justify-center hover:bg-gray-100 rounded-r-full"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ExploreTokens() {
  return (
    <div className="pt-[68px] md:px-6">
      <div className="w-full flex flex-col md:flex-row justify-center text-center md:text-start gap-2 md:justify-between items-center mb-5 md:mb-12">
        <h1 className="font-bold text-3xl ex-title">Explore Tokens</h1>
        <span className="lg:max-w-[26rem] text-xl ex-subtitle">Participate in all the latest token launches.</span>
      </div>
      
      <div className="relative w-full overflow-hidden">
        <Suspense fallback={<ExploreTokensLoading />}>
          <ExploreTokensContent />
        </Suspense>
        <ExploreTokensControls />
      </div>
    </div>
  );
}