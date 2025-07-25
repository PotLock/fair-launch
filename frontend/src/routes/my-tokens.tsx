import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MyTokenCard } from "../components/MyTokenCard";
import { WalletButton } from "../components/WalletButton";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState, useCallback } from "react";
import { TokenInfo } from "../utils/tokenUtils";
import { getTokenByAddress } from "../lib/api";
import { Coins } from "lucide-react";

export const Route = createFileRoute("/my-tokens")({
    component: MyTokens,
});

function MyTokens() {
    const { publicKey } = useWallet();
    const navigate = useNavigate()
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
            const tokens = await getTokenByAddress(publicKey.toBase58());
            setListTokens(tokens.data);
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
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                        <div className="w-32 h-32 mb-6 flex items-center justify-center">
                            <Coins className="w-32 h-32 text-gray-400"/>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No tokens found</h3>
                        <p className="text-gray-500 mb-6 max-w-md">
                            You haven't created any tokens yet. Start by deploying your first token to get started.
                        </p>
                        <button
                            onClick={()=>navigate({to: "/create"})}
                            className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                        >
                            Create Your First Token
                        </button>
                    </div>
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
                            avatar={token.avatarUrl || ''}
                            key={token.id}
                            progress={10}
                            name={token.name}
                            symbol={token.symbol}
                            supply={token.supply.toString()}
                            mintAddress={token.mintAddress || ''}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}