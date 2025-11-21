import { Card } from "@/components/ui/card";
import { RefreshCw, Loader2 } from "lucide-react";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { ChainType } from "@/types/bridge.types";

interface BridgeInfoCardProps {
    fromChain: ChainType;
    toChain: ChainType;
}

export const BridgeInfoCard = ({ fromChain, toChain }: BridgeInfoCardProps) => {
    const { prices, isLoading, getExchangeRate, refetch } = useCryptoPrices();

    // Map chain type to coin name for CoinGecko
    const chainToCoin = (chain: ChainType): string => {
        switch (chain) {
            case 'solana':
                return 'solana';
            case 'near':
                return 'near';
            case 'ethereum':
                return 'ethereum';
            default:
                return 'solana';
        }
    };

    // Get chain symbol for display
    const chainToSymbol = (chain: ChainType): string => {
        switch (chain) {
            case 'solana':
                return 'SOL';
            case 'near':
                return 'NEAR';
            case 'ethereum':
                return 'ETH';
            default:
                return 'TOKEN';
        }
    };

    const fromCoin = chainToCoin(fromChain);
    const toCoin = chainToCoin(toChain);
    const fromSymbol = chainToSymbol(fromChain);
    const toSymbol = chainToSymbol(toChain);

    const exchangeRate = getExchangeRate(fromCoin, toCoin);

    // Format exchange rate for display
    const formatRate = (rate: number | null): string => {
        if (rate === null) return '--';
        if (rate >= 1) {
            return rate.toFixed(4);
        }
        return rate.toFixed(6);
    };

    // Estimate processing time based on chains
    const getProcessingTime = (): string => {
        // Cross-chain bridging typically takes longer
        if (fromChain === 'solana' && toChain === 'near') {
            return '~80s';
        }
        if (fromChain === 'near' && toChain === 'solana') {
            return '~80s';
        }
        return '~60s';
    };

    return (
        <Card className="bg-gray-50 border border-gray-200 rounded-xl p-3 shadow-none mt-4">
            <div className="space-y-2">
                <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] sm:text-xs font-medium text-gray-600">Rate</span>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <button
                            onClick={() => refetch()}
                            disabled={isLoading}
                            className="disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-70 transition-opacity cursor-pointer"
                            aria-label="Refresh exchange rate"
                        >
                            {isLoading ? (
                                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 animate-spin" />
                            ) : (
                                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                            )}
                        </button>
                        <span className="text-[10px] sm:text-xs font-medium text-gray-600">
                            1 {fromSymbol} = {formatRate(exchangeRate)} {toSymbol}
                        </span>
                    </div>
                </div>
                <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] sm:text-xs font-medium text-gray-600">Estimated Processing Time</span>
                    <span className="text-[10px] sm:text-xs font-medium text-gray-600 shrink-0">{getProcessingTime()}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] sm:text-xs font-medium text-gray-600">Platform Fee</span>
                    <span className="text-[10px] sm:text-xs font-medium text-gray-600">0.25%</span>
                </div>
            </div>
        </Card>
    );
};
