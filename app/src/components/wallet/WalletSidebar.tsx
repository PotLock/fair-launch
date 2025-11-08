"use client"

import React, { useState, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletSelector } from '@near-wallet-selector/react-hook';
import { X, Power, Info, Copy, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getBalanceEVM, getEthPrice, getAllTokens as getAllEVMTokens, UserToken as EVMUserToken } from '@/lib/evm';
import { getNearBalance, getNearPrice, getAllTokenOnNear, formatBalanceNear } from '@/lib/near';
import { getSolBalance, getSolPrice, getAllTokens as getAllSolTokens, TokenInfo as SolTokenInfo } from '@/lib/sol';
import { toast } from 'sonner';
import { SOL_NETWORK, NEAR_NETWORK, EVM_NETWORK } from '@/configs/env.config';
import { formatNumberToCurrency } from '@/utils';

interface WalletSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onConnectAnother?: () => void;
}

interface TokenAsset {
    name: string;
    symbol: string;
    balance: string;
    logo?: string;
    usdValue?: number;
}

interface ConnectedWallet {
    type: 'solana' | 'near' | 'evm';
    address: string;
    displayName: string;
    balance?: string;
    nativeBalance?: string;
    tokens?: TokenAsset[];
    network?: string;
}

interface WalletBalance {
    solana: number;
    near: number;
    evm: number;
}

const WalletSidebar: React.FC<WalletSidebarProps> = ({ 
    isOpen, 
    onClose,
    onConnectAnother
}) => {
    const { address, isConnected: evmConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const { publicKey, connected: solanaConnected, disconnect: disconnectSolana } = useWallet();
    const { signOut, signedAccountId} = useWalletSelector();
    
    const [walletBalances, setWalletBalances] = useState<WalletBalance>({
        solana: 0,
        near: 0,
        evm: 0
    });
    const [isLoadingBalances, setIsLoadingBalances] = useState(false);
    const [expandedWallets, setExpandedWallets] = useState<Set<string>>(new Set());
    const [walletTokens, setWalletTokens] = useState<{
        solana: TokenAsset[];
        near: TokenAsset[];
        evm: TokenAsset[];
    }>({
        solana: [],
        near: [],
        evm: []
    });

    const getConnectedWallets = (): ConnectedWallet[] => {
        const wallets: ConnectedWallet[] = [];

        if (solanaConnected && publicKey) {
            const solBalance = walletBalances.solana;
            const nativeBalance = walletTokens.solana.find(t => t.symbol === 'SOL')?.balance || '0';
            wallets.push({
                type: 'solana',
                address: publicKey.toString(),
                displayName: 'Solana Wallet',
                balance: solBalance.toFixed(2),
                nativeBalance,
                tokens: walletTokens.solana,
                network: SOL_NETWORK || 'devnet'
            });
        }

        if (signedAccountId) {
            const nearBalance = walletBalances.near;
            const nativeBalance = walletTokens.near.find(t => t.symbol === 'NEAR')?.balance || '0';
            wallets.push({
                type: 'near',
                address: signedAccountId,
                displayName: 'NEAR Wallet',
                balance: nearBalance.toFixed(2),
                nativeBalance,
                tokens: walletTokens.near,
                network: NEAR_NETWORK || 'testnet'
            });
        }

        if (evmConnected && address) {
            const evmBalance = walletBalances.evm;
            const nativeBalance = walletTokens.evm.find(t => t.symbol === 'ETH')?.balance || '0';
            wallets.push({
                type: 'evm',
                address: address,
                displayName: 'MetaMask',
                balance: evmBalance.toFixed(2),
                nativeBalance,
                tokens: walletTokens.evm,
                network: EVM_NETWORK || 'sepolia'
            });
        }

        return wallets;
    };

    const fetchBalances = async () => {
        setIsLoadingBalances(true);
        try {
            const newBalances: WalletBalance = {
                solana: 0,
                near: 0,
                evm: 0
            };

            const newTokens: {
                solana: TokenAsset[];
                near: TokenAsset[];
                evm: TokenAsset[];
            } = {
                solana: [],
                near: [],
                evm: []
            };

            // Fetch Solana balance and tokens
            if (solanaConnected && publicKey) {
                try {
                    const [solBalance, solPrice, solTokens] = await Promise.all([
                        getSolBalance(publicKey.toString()),
                        getSolPrice(),
                        getAllSolTokens(publicKey.toString()).catch(() => [] as SolTokenInfo[])
                    ]);

                    // Add native SOL as first token
                    newTokens.solana.push({
                        name: 'Solana',
                        symbol: 'SOL',
                        balance: solBalance.toFixed(4),
                        usdValue: solBalance * (solPrice || 0)
                    });

                    // Add other tokens
                    solTokens.forEach((token) => {
                        newTokens.solana.push({
                            name: token.name,
                            symbol: token.symbol,
                            balance: token.balance.toFixed(4),
                            logo: token.image,
                            usdValue: 0 // Price data would need to be fetched separately
                        });
                    });

                    newBalances.solana = solBalance * (solPrice || 0);
                } catch (error) {
                    console.error('Error fetching Solana balance:', error);
                }
            }

            // Fetch NEAR balance and tokens
            if (signedAccountId) {
                try {
                    const [nearBalance, nearPrice, nearTokens] = await Promise.all([
                        getNearBalance(signedAccountId),
                        getNearPrice(),
                        getAllTokenOnNear(signedAccountId).catch(() => [])
                    ]);

                    // Add native NEAR as first token
                    newTokens.near.push({
                        name: 'NEAR',
                        symbol: 'NEAR',
                        balance: nearBalance,
                        usdValue: parseFloat(nearBalance) * (nearPrice || 0)
                    });

                    // Add other tokens
                    nearTokens.forEach((token: any) => {
                        const formattedBalance = formatBalanceNear(token.amount);
                        newTokens.near.push({
                            name: token.ft_meta?.name || token.contract,
                            symbol: token.ft_meta?.symbol || 'Unknown',
                            balance: formattedBalance,
                            logo: token.ft_meta?.icon,
                            usdValue: 0
                        });
                    });

                    newBalances.near = parseFloat(nearBalance) * (nearPrice || 0);
                } catch (error) {
                    console.error('Error fetching NEAR balance:', error);
                }
            }

            // Fetch EVM balance and tokens
            if (evmConnected && address) {
                try {
                    const [evmBalance, priceEth, evmTokens] = await Promise.all([
                        getBalanceEVM(address),
                        getEthPrice(),
                        getAllEVMTokens(address).catch(() => [] as EVMUserToken[])
                    ]);

                    // Add native ETH as first token
                    newTokens.evm.push({
                        name: 'Ethereum',
                        symbol: 'ETH',
                        balance: parseFloat(evmBalance).toFixed(4),
                        usdValue: parseFloat(evmBalance) * (priceEth || 0)
                    });

                    // Add other tokens
                    evmTokens.forEach((token) => {
                        newTokens.evm.push({
                            name: token.name,
                            symbol: token.symbol,
                            balance: parseFloat(token.balance).toFixed(4),
                            logo: token.logo,
                            usdValue: 0
                        });
                    });

                    newBalances.evm = parseFloat(evmBalance) * (priceEth || 0);
                } catch (error) {
                    console.error('Failed to fetch EVM balance:', error);
                }
            }

            setWalletBalances(newBalances);
            setWalletTokens(newTokens);
        } catch (error) {
            console.error('Error fetching balances:', error);
        } finally {
            setIsLoadingBalances(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchBalances();
        }
    }, [isOpen, solanaConnected, signedAccountId, evmConnected, publicKey, address]);

    const getTotalBalance = (): number => {
        return walletBalances.solana + walletBalances.near + walletBalances.evm;
    };

    const handleCopyAddress = async (address: string) => {
        try {
            await navigator.clipboard.writeText(address);
            toast.success('Address copied to clipboard!');
        } catch (error) {
            toast.error('Failed to copy address');
        }
    };

    const handleDisconnectWallet = async (walletType: 'solana' | 'near' | 'evm') => {
        switch (walletType) {
            case 'solana':
                disconnectSolana();
                break;
            case 'near':
                if (signedAccountId) {
                    try {
                        await signOut();
                    } catch (error) {
                        console.error('Failed to disconnect NEAR wallet:', error);
                        toast.error('Failed to disconnect NEAR wallet');
                    }
                }
                break;
            case 'evm':
                disconnect();
                break;
        }
    };

    const getWalletIcon = (type: 'solana' | 'near' | 'evm') => {
        switch (type) {
            case 'solana':
                return '/chains/solana.svg';
            case 'near':
                return '/chains/near.png';
            case 'evm':
                return '/chains/ethereum.png';
            default:
                return '/chains/ethereum.png';
        }
    };

    const getWalletDisplayName = (wallet: ConnectedWallet) => {
        if (wallet.type === 'near') {
            return wallet.address;
        }
        return `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`;
    };

    const getNetworkBadgeColor = (network: string) => {
        const testnetKeywords = ['testnet', 'devnet', 'sepolia', 'holesky'];
        const isTestnet = testnetKeywords.some(keyword => network.toLowerCase().includes(keyword));
        return isTestnet ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
    };

    const getNetworkDisplayName = (network: string) => {
        if (!network) return 'Unknown';
        return network.charAt(0).toUpperCase() + network.slice(1);
    };

    const toggleWalletExpanded = (walletAddress: string) => {
        setExpandedWallets(prev => {
            const newSet = new Set(prev);
            if (newSet.has(walletAddress)) {
                newSet.delete(walletAddress);
            } else {
                newSet.add(walletAddress);
            }
            return newSet;
        });
    };

    const connectedWallets = getConnectedWallets();
    const totalBalance = getTotalBalance();

    if (!isOpen) return null;

    return (
        <>
            <div 
                className="fixed inset-0 bg-black/70 bg-opacity-50 z-40"
                onClick={onClose}
            />
            
            <div className={`fixed right-0 top-0 h-full w-80 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                        >
                        <X className="w-5 h-5 text-gray-600" />
                        </button>
                            <Button
                            variant="outline"
                            size="sm"
                            className="text-sm border-gray-300 hover:bg-gray-50 hover:text-gray-500 cursor-pointer"
                            onClick={() => {
                                onClose();
                                onConnectAnother?.();
                            }}
                        >
                            Connect another wallet
                        </Button>
                    </div>

                    <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                        {connectedWallets.map((wallet, index) => {
                            const isExpanded = expandedWallets.has(wallet.address);
                            const hasTokens = wallet.tokens && wallet.tokens.length > 0;

                            return (
                                <Collapsible
                                    key={index}
                                    open={isExpanded}
                                    onOpenChange={() => toggleWalletExpanded(wallet.address)}
                                >
                                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                                        <div className="flex items-center justify-between p-3 bg-white">
                                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                                                    {wallet.type === "evm" ? (
                                                        <img
                                                            src={getWalletIcon(wallet.type)}
                                                            alt={wallet.displayName}
                                                            className="w-7 h-7 object-contain"
                                                        />
                                                    ) : (
                                                        <img
                                                            src={getWalletIcon(wallet.type)}
                                                            alt={wallet.displayName}
                                                            className="w-6 h-6 object-contain"
                                                        />
                                                    )}
                                                </div>
                                                <div className='flex flex-col space-y-1 flex-1 min-w-0'>
                                                    <div className="flex items-center gap-2">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="text-sm font-medium text-gray-900 cursor-help truncate">
                                                                    {getWalletDisplayName(wallet)}
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="text-xs">{wallet.address}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        {wallet.network && (
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getNetworkBadgeColor(wallet.network)}`}>
                                                                {getNetworkDisplayName(wallet.network)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className='text-xs text-gray-500'>${wallet.balance}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-1 flex-shrink-0">
                                                {hasTokens && (
                                                    <CollapsibleTrigger asChild>
                                                        <button className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer">
                                                            {isExpanded ? (
                                                                <ChevronDown className="w-4 h-4 text-gray-600" />
                                                            ) : (
                                                                <ChevronRight className="w-4 h-4 text-gray-600" />
                                                            )}
                                                        </button>
                                                    </CollapsibleTrigger>
                                                )}
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            onClick={() => handleCopyAddress(wallet.address)}
                                                            className="p-1 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                                                        >
                                                            <Copy className="w-4 h-4 text-gray-500" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent className='border border-gray-100'>
                                                        <p>Copy address</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            onClick={() => handleDisconnectWallet(wallet.type)}
                                                            className="p-1 hover:bg-red-100 rounded transition-colors cursor-pointer"
                                                        >
                                                            <Power className="w-4 h-4 text-red-500" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent className='border border-gray-100'>
                                                        <p>Disconnect wallet</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>

                                        {hasTokens && (
                                            <CollapsibleContent>
                                                <div className="border-t border-gray-200 bg-gray-50 px-3 py-2">
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-medium text-gray-600 mb-2">Assets ({wallet?.tokens?.length})</p>
                                                        {wallet?.tokens?.map((token, tokenIndex) => (
                                                            <div key={tokenIndex} className="flex items-center justify-between py-1.5 px-2 bg-white rounded border border-gray-100">
                                                                <div className="flex items-center space-x-2">
                                                                    {token.logo && (
                                                                        <img
                                                                            src={token.logo}
                                                                            alt={token.symbol}
                                                                            className="w-5 h-5 rounded-full object-cover"
                                                                            onError={(e) => {
                                                                                e.currentTarget.style.display = 'none';
                                                                            }}
                                                                        />
                                                                    )}
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs font-medium text-gray-900">{token.symbol}</span>
                                                                        <span className="text-[10px] text-gray-500">{token.name}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-xs font-medium text-gray-900">{formatNumberToCurrency(Number(token.balance))}</span>
                                                                    {token.usdValue !== undefined && token.usdValue > 0 && (
                                                                        <span className="text-[10px] text-gray-500">${token.usdValue.toFixed(2)}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </CollapsibleContent>
                                        )}
                                    </div>
                                </Collapsible>
                            );
                        })}
                        <div className="pt-6">
                            <div className="flex items-center space-x-2 mb-2">
                                <span className="text-base font-medium text-gray-700">Total balance</span>
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                                </TooltipTrigger>
                                    <TooltipContent className="max-w-xs border border-gray-100">
                                        <div className="space-y-2">
                                            <p className="text-xs text-gray-600">
                                                Total Balance shows the combined USD value of all your connected wallets across Solana, NEAR, and EVM chains
                                            </p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <div className="text-4xl font-bold text-gray-900">
                                {isLoadingBalances ? (
                                    <Skeleton className="h-9 w-32" />
                                ) : (
                                    `$${totalBalance.toFixed(2)}`
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default WalletSidebar;
