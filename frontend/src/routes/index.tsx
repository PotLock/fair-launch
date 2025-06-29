import { createFileRoute } from "@tanstack/react-router";
import { TokenCard } from "../components/TokenCard";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { getAllTokensCreatedByBondingCurve, getTokenInfo, TokenInfo } from "../utils/tokenUtils";

export const Route = createFileRoute("/")({
    component: Home,
});

function Home() {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get all token mint addresses created by bonding curve
        const mintAddresses = await getAllTokensCreatedByBondingCurve();
        console.log('Found mint addresses:', mintAddresses);
        
        // Fetch detailed information for each token
        const tokenPromises = mintAddresses.map(async (mintAddress) => {
          try {
            const tokenInfo = await getTokenInfo(mintAddress);
            return tokenInfo;
          } catch (error) {
            console.error(`Error fetching token info for ${mintAddress}:`, error);
            return null;
          }
        });
        
        const tokenResults = await Promise.all(tokenPromises);
        const validTokens = tokenResults.filter(token => token !== null) as TokenInfo[];
        
        setTokens(validTokens);
      } catch (error) {
        console.error('Error fetching tokens:', error);
        setError('Failed to load tokens. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-10">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-black mb-2">Token Launchpad</h1>
          <p className="text-gray-500 mb-8 text-base">
            Discover and participate in token launches. Support projects you believe in.
          </p>
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-10">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-black mb-2">Token Launchpad</h1>
          <p className="text-gray-500 mb-8 text-base">
            Discover and participate in token launches. Support projects you believe in.
          </p>
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-black text-white px-4 py-2 rounded-md hover:bg-opacity-80 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-black mb-2">Token Launchpad</h1>
        <p className="text-gray-500 mb-8 text-base">
          Discover and participate in token launches. Support projects you believe in.
        </p>
        {tokens.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No tokens found</p>
            <p className="text-gray-400 text-sm mt-2">Tokens created through bonding curves will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tokens.map((token) => (
              <TokenCard
                avatar={token.avatar || "/curate.png"}
                banner={token.banner || token.avatar || "/curate.png"}
                key={token.id}
                type={'Bonding Curve Token'}
                progress={10}
                name={token.name}
                symbol={token.symbol}
                description={token.description || "No description available"}
                supply={token.supply.toString()}
                address={token.id}
                createdOn={token.createdOn}
                externalLabel="View on Explorer"
                value={token.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}