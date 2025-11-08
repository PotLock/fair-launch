import { TableCell, TableRow } from "@/components/ui/table";
import { CHAINS } from "@/constants/bridge.constants";
import { getTokenByMint } from "@/lib/api";
import { Token, Transaction, TransactionAction, TransactionChain } from "@/types/api";
import { ChainType } from "@/types/bridge.types";
import { timeAgo } from "@/utils";
import { getStatusColor, getStatusIcon } from "@/utils/bridge.utils";
import { ExternalLink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function TableTx({ transaction }: { transaction: Transaction }) {
    const [token, setToken] = useState<Token>();
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const fetchInfoToken = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await getTokenByMint(transaction.baseToken);
            if (!response) {
                throw new Error("Fetch API info token fail");
            }
            setToken(response);
        } catch (error) {
            setIsLoading(false);
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [transaction.baseToken]);

    useEffect(() => {
        fetchInfoToken();
    }, [fetchInfoToken]);

    const chainToChainType = (chain: TransactionChain): ChainType => {
        const chainLower = chain.toLowerCase();
        if (chainLower === 'solana') return 'solana';
        if (chainLower === 'ethereum') return 'ethereum';
        if (chainLower === 'near') return 'near';
        return 'solana'; // default fallback
    };

    const getAmount = (tx: Transaction): string => {
        if (tx.action === TransactionAction.BRIDGE) {
            return Number(tx.amountIn).toFixed(3);
        }
        return Number(tx.amountIn).toFixed(3);
    };

    const chainType = chainToChainType(transaction.chain);
    const explorerUrl = CHAINS[chainType]?.explorerUrl || CHAINS.solana.explorerUrl;

    return (
        <TableRow className="hover:bg-gray-50">
            <TableCell className="text-sm text-gray-600" style={{paddingLeft: "20px"}}>{timeAgo(transaction.createdAt)}</TableCell>
            <TableCell className="text-sm font-medium text-gray-900">{transaction.action}</TableCell>
            <TableCell className={`text-sm font-medium ${getStatusColor(transaction.status)} flex items-center gap-1`}>
                {transaction.status.toUpperCase()}
            </TableCell>
            <TableCell>
                {isLoading ? (
                    <div className="flex flex-row gap-1 items-center">
                        <div className="h-6 w-6 bg-gray-200 rounded-full" />
                        <span className="text-sm text-gray-600">-</span>
                    </div>
                ) : (
                    <div className="flex flex-row gap-1 items-center">
                        <div className="h-6 w-6 rounded-full">
                            <img src={token?.metadata.tokenUri} alt={token?.symbol} className="h-full w-full rounded-full" />
                        </div>
                        <span className="text-sm text-gray-600">{token?.symbol}</span>
                    </div>
                )}
            </TableCell>
            <TableCell className="text-sm text-gray-600">{getAmount(transaction)}</TableCell>
            <TableCell className="text-right" style={{paddingRight: "20px"}}>
                <div className="flex gap-2 justify-end">
                    {transaction.txHash && (
                        <a
                            href={`${explorerUrl}/tx/${transaction.txHash}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
}