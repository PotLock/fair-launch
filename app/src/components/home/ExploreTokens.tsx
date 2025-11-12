import { Suspense } from "react";
import ExploreTokensLoading from "./ExploreTokensLoading";
import { getTokens } from "@/lib/api";
import { Token } from "@/types/api";
import ExploreTokensCarousel from "./ExploreTokensCarousel";

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

    return <ExploreTokensCarousel tokens={tokens} />;
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

export default function ExploreTokens() {
  return (
    <div className="pt-[68px] md:px-6">
      <div className="w-full flex flex-col md:flex-row justify-center text-center md:text-start gap-2 md:justify-between items-center mb-5 md:mb-12">
        <h1 className="font-bold text-3xl ex-title">Explore Tokens</h1>
        <span className="lg:max-w-104 text-xl ex-subtitle">Participate in all the latest token launches.</span>
      </div>
      
      <div className="relative w-full overflow-hidden">
        <Suspense fallback={<ExploreTokensLoading />}>
          <ExploreTokensContent />
        </Suspense>
      </div>
    </div>
  );
}