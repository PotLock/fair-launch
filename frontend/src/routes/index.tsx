import { createFileRoute } from "@tanstack/react-router";
import { TokenCard } from "../components/TokenCard";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { getMintAccounts, getTokenInfo, TokenInfo } from "../utils/tokenUtils";


export const Route = createFileRoute("/")({
    component: Token,
});

function Token() {
  const { publicKey } = useWallet();
  const [listTokens, setListTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTokens() {
      if (!publicKey) {
        setListTokens([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const listMintAccounts = await getMintAccounts(publicKey.toBase58());
        for (const mintAccount of listMintAccounts) {
          const tokenInfo = await getTokenInfo(mintAccount.mint);
          setListTokens(prev => [...prev, tokenInfo]);
        }
      } catch (err) {
        setError('Failed to fetch token balances');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchTokens();
  }, [publicKey]);

  if (!publicKey) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-10">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-black mb-2">My Tokens</h1>
          <p className="text-gray-500 mb-8 text-base">
            Please connect your wallet to view your tokens
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-10">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-black mb-2">My Tokens</h1>
          <p className="text-gray-500 mb-8 text-base">Loading your tokens...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-10">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-black mb-2">My Tokens</h1>
          <p className="text-red-500 mb-8 text-base">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-black mb-2">My Tokens</h1>
        <p className="text-gray-500 mb-8 text-base">
          View and manage all the tokens you've created on the token launch platforms
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {listTokens.map((token) => (
            <TokenCard
              avatar={token.avatar}
              banner={token.banner}
              key={token.id}
              type={'Meme Coin'}
              progress={10}
              name={token.name}
              symbol={token.symbol}
              description={token.description}
              supply={token.supply.toString()}
              address={token.id}
              createdOn={token.createdOn}
              externalLabel={'Raydium'}
            />
          ))}
        </div>
      </div>
    </div>
  );
}