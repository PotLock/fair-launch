import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Transaction, ChainType, TransactionChain, TransactionAction } from "@/types/bridge.types";
import { CHAINS } from "@/constants/bridge.constants";
import { getStatusColor, getStatusIcon } from "@/utils/bridge.utils";

interface TransactionHistoryProps {
    transactions: Transaction[];
}

// Helper to convert TransactionChain enum to ChainType
const chainToChainType = (chain: TransactionChain): ChainType => {
    const chainLower = chain.toLowerCase();
    if (chainLower === 'solana') return 'solana';
    if (chainLower === 'ethereum') return 'ethereum';
    if (chainLower === 'near') return 'near';
    return 'solana'; // default fallback
};

// Helper to format date
const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
};

// Helper to get coin symbol from transaction
const getCoinSymbol = (tx: Transaction): string => {
    // For BRIDGE actions, use baseToken; for others, use feeToken or baseToken
    if (tx.action === TransactionAction.BRIDGE) {
        return tx.baseToken.slice(0, 4).toUpperCase();
    }
    return tx.feeToken || tx.baseToken.slice(0, 4).toUpperCase();
};

// Helper to get amount from transaction
const getAmount = (tx: Transaction): string => {
    if (tx.action === TransactionAction.BRIDGE) {
        return Number(tx.amountIn).toFixed(4);
    }
    return Number(tx.amountIn).toFixed(4);
};

export const TransactionHistory = ({ transactions }: TransactionHistoryProps) => {
    return (
        <div className="flex-1">
            <Card className="bg-white border border-gray-200 rounded-xl shadow-none p-0">
                <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                    <div className="flex justify-between items-center">
                        <div className="flex gap-8">
                            <span className="text-xs font-medium text-gray-900">DATE & TIME</span>
                            <div className="flex gap-8">
                                <span className="text-xs font-medium text-gray-900">STATUS</span>
                                <span className="text-xs font-medium text-gray-900">COIN</span>
                                <span className="text-xs font-medium text-gray-900">AMOUNT</span>
                            </div>
                        </div>
                        <span className="text-xs font-medium text-gray-900">ACTIONS</span>
                    </div>
                </div>

                <div className="p-8">
                    {transactions.length === 0 ? (
                        <div className="text-center">
                            <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                                <img src="/icons/empty.svg" alt="empty" className="w-full h-full" />
                            </div>
                            <p className="text-gray-500 text-lg">No transaction found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {transactions.map((tx) => {
                                const chainType = chainToChainType(tx.chain);
                                const explorerUrl = CHAINS[chainType]?.explorerUrl || CHAINS.solana.explorerUrl;
                                
                                return (
                                    <div key={tx.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                                        <div className="flex gap-8">
                                            <span className="text-sm text-gray-600">{formatDate(tx.createdAt)}</span>
                                            <div className="flex gap-8">
                                                <span className={`text-sm font-medium ${getStatusColor(tx.status)} flex items-center gap-1`}>
                                                    {getStatusIcon(tx.status)} {tx.status.toUpperCase()}
                                                </span>
                                                <span className="text-sm text-gray-600">{getCoinSymbol(tx)}</span>
                                                <span className="text-sm text-gray-600">{getAmount(tx)}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {tx.txHash && (
                                                <a
                                                    href={`${explorerUrl}/tx/${tx.txHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                            <Button variant="outline" size="sm">
                                                View
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};
