import { TableCell, TableRow } from "@/components/ui/table";
import { CHAINS } from "@/constants/bridge.constants";
import { getTokenByMint } from "@/lib/api";
import { Token, Transaction, TransactionAction, TransactionChain } from "@/types/api";
import { ChainType } from "@/types/bridge.types";
import { timeAgo } from "@/utils";
import { getStatusColor } from "@/utils/bridge.utils";
import { ExternalLink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Connection, PublicKey } from '@solana/web3.js';
import { deserializeMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { getRpcSOLEndpoint } from "@/lib/sol";
import { ethers } from "ethers";
import { getRpcEVMEndpoint } from "@/lib/evm";
import { getRpcNEAREndpoint } from "@/lib/near";
import { TATUM_API_KEY } from "@/configs/env.config";

const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  }
];

interface FallbackTokenInfo {
    symbol: string;
    name?: string;
    image?: string;
}

export function TableTx({ transaction }: { transaction: Transaction }) {
    const [token, setToken] = useState<Token>();
    const [fallbackToken, setFallbackToken] = useState<FallbackTokenInfo>();
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const fetchTokenFromSolana = async (mintAddress: string): Promise<FallbackTokenInfo | null> => {
        try {
            console.log('Fetching Solana token metadata for:', mintAddress);
            
            // Validate if address is a valid Solana address (base58)
            // Solana addresses are 32-44 characters of base58
            const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
            if (!base58Regex.test(mintAddress)) {
                console.warn('Invalid Solana address format:', mintAddress);
                return null;
            }
            
            const connection = new Connection(getRpcSOLEndpoint());
            let mintPublicKey: PublicKey;
            
            try {
                mintPublicKey = new PublicKey(mintAddress);
            } catch (error) {
                console.warn('Failed to create PublicKey from address:', mintAddress);
                return null;
            }
            
            const [metadataPDA] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("metadata"),
                    TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                    mintPublicKey.toBuffer(),
                ],
                TOKEN_METADATA_PROGRAM_ID
            );

            const accountInfo = await connection.getAccountInfo(metadataPDA);
            if (!accountInfo?.data) {
                console.warn('Solana metadata account not found for:', mintAddress);
                return null;
            }
            
            //@ts-ignore
            const metadata = deserializeMetadata(accountInfo);
            
            let imageUrl: string | undefined;
            try {
                if (metadata.uri) {
                    const imageResponse = await fetch(metadata.uri, { 
                        signal: AbortSignal.timeout(5000) 
                    });
                    if (imageResponse.ok) {
                        const imageData = await imageResponse.json();
                        imageUrl = imageData?.image;
                    }
                }
            } catch (fetchError) {
                console.warn('Unable to fetch Solana metadata JSON:', fetchError);
            }
            
            const tokenInfo = {
                symbol: metadata.symbol?.replace(/\0/g, '') || 'UNKNOWN',
                name: metadata.name?.replace(/\0/g, '') || 'Unknown Token',
                image: imageUrl,
            };
            
            console.log('Solana token metadata:', tokenInfo);
            return tokenInfo;
        } catch (error) {
            console.error('Error fetching Solana token metadata:', error);
            return null;
        }
    };

    const fetchTokenFromEVM = async (tokenAddress: string): Promise<FallbackTokenInfo | null> => {
        try {
            console.log('Fetching EVM token metadata for:', tokenAddress);
            
            // Validate if address is a valid EVM address (0x + 40 hex chars)
            if (!ethers.isAddress(tokenAddress)) {
                console.warn('Invalid EVM address format:', tokenAddress);
                return null;
            }
            
            const provider = new ethers.JsonRpcProvider(getRpcEVMEndpoint());
            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
            
            const [symbol, name] = await Promise.all([
                tokenContract.symbol(),
                tokenContract.name()
            ]);
            
            const tokenInfo = {
                symbol: symbol || 'UNKNOWN',
                name: name || 'Unknown Token',
                image: undefined
            };
            
            console.log('EVM token metadata:', tokenInfo);
            return tokenInfo;
        } catch (error) {
            console.error('Error fetching EVM token metadata:', error);
            return null;
        }
    };

    const fetchTokenFromNEAR = async (tokenContractId: string): Promise<FallbackTokenInfo | null> => {
        try {
            console.log('Fetching NEAR token metadata for:', tokenContractId);
            
            // Validate if address looks like a NEAR account
            // NEAR accounts can be like "token.near" or "usdc.testnet" or "abc123...xyz.near"
            // They should contain at least one dot or be an implicit account (64 hex chars)
            const nearAccountRegex = /^([a-z0-9_-]+\.)*[a-z0-9_-]+\.[a-z]+$|^[a-f0-9]{64}$/i;
            if (!nearAccountRegex.test(tokenContractId)) {
                console.warn('Invalid NEAR account format:', tokenContractId);
                return null;
            }
            
            // Create headers with authorization if available
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            
            if (TATUM_API_KEY) {
                headers['authorization'] = `bearer ${TATUM_API_KEY}`;
            }
            
            const response = await fetch(`${getRpcNEAREndpoint()}/call`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 'dontcare',
                    method: 'query',
                    params: {
                        request_type: 'call_function',
                        finality: 'final',
                        account_id: tokenContractId,
                        method_name: 'ft_metadata',
                        args_base64: btoa('{}') // Use btoa for browser compatibility
                    }
                })
            });

            if (!response.ok) {
                console.warn(`NEAR RPC request failed: ${response.status} ${response.statusText}`);
                return null;
            }

            const data = await response.json();
            
            if (data.error) {
                console.warn('NEAR RPC error:', data.error);
                return null;
            }
            
            if (!data?.result?.result) {
                console.warn('NEAR RPC response missing result');
                return null;
            }

            const rawResult = data.result.result;
            let decodedResult: string;
            
            if (typeof rawResult === 'string') {
                decodedResult = atob(rawResult); // Use atob for browser compatibility
            } else if (Array.isArray(rawResult)) {
                decodedResult = String.fromCharCode(...rawResult);
            } else {
                console.warn('Unsupported NEAR result format:', typeof rawResult);
                return null;
            }

            const metadata = JSON.parse(decodedResult);
            console.log('NEAR token metadata:', metadata);
            
            return {
                symbol: metadata.symbol || 'UNKNOWN',
                name: metadata.name || 'Unknown Token',
                image: metadata.icon
            };
        } catch (error) {
            console.error('Error fetching NEAR token metadata:', error);
            return null;
        }
    };

    const fetchInfoToken = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await getTokenByMint(transaction.baseToken);
            if (response) {
                setToken(response);
                setFallbackToken(undefined);
            } else {
                throw new Error("Token not found in database");
            }
        } catch (error) {
            console.log('Falling back to chain-specific fetch:', transaction.chain);
            
            // Fallback to chain-specific fetch
            let fallbackInfo: FallbackTokenInfo | null = null;
            
            const chainLower = transaction.chain.toLowerCase();
            if (chainLower === 'solana') {
                fallbackInfo = await fetchTokenFromSolana(transaction.baseToken);
            } else if (chainLower === 'near') {
                fallbackInfo = await fetchTokenFromNEAR(transaction.baseToken);
            } else if (['ethereum', 'base', 'arbitrum', 'bnb'].includes(chainLower)) {
                fallbackInfo = await fetchTokenFromEVM(transaction.baseToken);
            }
            
            if (fallbackInfo) {
                setFallbackToken(fallbackInfo);
                setToken(undefined);
            } else {
                // If all fallbacks fail, show placeholder
                setFallbackToken({
                    symbol: 'UNKNOWN',
                    name: 'Unknown Token',
                    image: undefined
                });
                setToken(undefined);
            }
        } finally {
            setIsLoading(false);
        }
    }, [transaction.baseToken, transaction.chain]);

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
            <TableCell className="text-xs sm:text-sm text-gray-600" style={{paddingLeft: "20px"}}>{timeAgo(transaction.createdAt)}</TableCell>
            <TableCell className="text-xs sm:text-sm font-medium text-gray-900">{transaction.action}</TableCell>
            <TableCell className={`text-xs sm:text-sm font-medium ${getStatusColor(transaction.status)} flex items-center gap-1`}>
                {transaction.status.toUpperCase()}
            </TableCell>
            <TableCell>
                {isLoading ? (
                    <div className="flex flex-row gap-1 items-center">
                        <div className="h-5 w-5 sm:h-6 sm:w-6 bg-gray-200 rounded-full animate-pulse" />
                        <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
                    </div>
                ) : (
                    <div className="flex flex-row gap-1 items-center">
                        <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {token?.metadata.tokenUri || fallbackToken?.image ? (
                                <img 
                                    src={token?.metadata.tokenUri || fallbackToken?.image} 
                                    alt={token?.symbol || fallbackToken?.symbol} 
                                    className="h-full w-full rounded-full object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                    }}
                                />
                            ) : (
                                <span className="text-[8px] sm:text-[10px] font-semibold text-gray-500">
                                    {(token?.symbol || fallbackToken?.symbol || 'T').substring(0, 2).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <span className="text-xs sm:text-sm text-gray-600">
                            {token?.symbol || fallbackToken?.symbol || 'UNKNOWN'}
                        </span>
                    </div>
                )}
            </TableCell>
            <TableCell className="text-xs sm:text-sm text-gray-600">{getAmount(transaction)}</TableCell>
            <TableCell className="text-right" style={{paddingRight: "20px"}}>
                <div className="flex gap-2 justify-end">
                    {transaction.txHash && (
                        <a
                            href={`${explorerUrl}/tx/${transaction.txHash}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                        >
                            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                        </a>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
}