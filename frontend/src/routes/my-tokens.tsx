import { createFileRoute } from "@tanstack/react-router";
import { MyTokenCard } from "../components/MyTokenCard";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState, useCallback } from "react";
import { getMintAccounts, getTokenInfo, TokenInfo } from "../utils/tokenUtils";


export const Route = createFileRoute("/my-tokens")({
    component: MyTokens,
});

function MyTokens() {
    const { publicKey } = useWallet();
    const [listTokens, setListTokens] = useState<TokenInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTokens = useCallback(async () => {
        if (!publicKey) {
            setListTokens([]);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const listMintAccounts = await getMintAccounts(publicKey.toBase58());
            
            const tokenInfoPromises = listMintAccounts.map(mintAccount => 
                getTokenInfo(mintAccount.mint)
            );
            const tokens = await Promise.all(tokenInfoPromises);
            setListTokens(tokens);
        } catch (err) {
            setError('Failed to fetch token balances');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [publicKey]);

    useEffect(() => {
        fetchTokens();
    }, [fetchTokens]);

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

    if (listTokens.length === 0) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] py-10">
                <div className="max-w-7xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-black mb-2">My Tokens</h1>
                <p className="text-gray-500 mb-8 text-base">You don't have any tokens</p>
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
                        <MyTokenCard
                            avatar={token.avatar}
                            key={token.id}
                            progress={10}
                            name={token.name}
                            symbol={token.symbol}
                            supply={token.supply.toString()}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}