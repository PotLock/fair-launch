import React, { useState, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletSelector } from '@near-wallet-selector/react-hook';
import { X, Power, Info, Copy } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Skeleton } from './ui/skeleton';
import { getBalanceEVM, getEthPrice } from '../lib/evm';
import { getNearBalance, getNearPrice } from '../lib/near';
import { getSolBalance, getSolPrice } from '../lib/sol';
import toast from 'react-hot-toast';

interface WalletSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onConnectAnother?: () => void;
}

interface ConnectedWallet {
    type: 'solana' | 'near' | 'evm';
    address: string;
    displayName: string;
    balance?: string;
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

    const getConnectedWallets = (): ConnectedWallet[] => {
        const wallets: ConnectedWallet[] = [];
        
        if (solanaConnected && publicKey) {
            wallets.push({
                type: 'solana',
                address: publicKey.toString(),
                displayName: 'Solana Wallet',
                balance: walletBalances.solana.toFixed(5)
            });
        }
        
        if (signedAccountId) {
            wallets.push({
                type: 'near',
                address: signedAccountId,
                displayName: 'NEAR Wallet',
                balance: walletBalances.near.toFixed(5)
            });
        }
        
        if (evmConnected && address) {
            wallets.push({
                type: 'evm',
                address: address,
                displayName: 'MetaMask',
                balance: walletBalances.evm.toFixed(5)
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

        // Fetch Solana balance
        if (solanaConnected && publicKey) {
            try {
                const solBalance = await getSolBalance(publicKey.toString());
                const solPrice = await getSolPrice();
                newBalances.solana = solBalance * (solPrice || 0);
            } catch (error) {
                console.error('Error fetching Solana balance:', error);
            }
        }

        // Fetch NEAR balance
        if (signedAccountId) {
            try {
                const nearBalance = await getNearBalance(signedAccountId);
                const nearPrice = await getNearPrice();
                newBalances.near = parseFloat(nearBalance) * (nearPrice || 0);
            } catch (error) {
                console.error('Error fetching NEAR balance:', error);
            }
        }

        // Fetch EVM balance
        if (evmConnected && address) {
            try {
                const evmBalance = await getBalanceEVM(address);
                const priceEth = await getEthPrice();
                newBalances.evm = parseFloat(evmBalance) * (priceEth || 0);
            } catch (error) {
                toast.error('Failed to fetch EVM balance');
            }
        }

        setWalletBalances(newBalances);
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

    const connectedWallets = getConnectedWallets();
    const totalBalance = getTotalBalance();

    if (!isOpen) return null;

    return (
        <>
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={onClose}
            />
            
            <div className={`fixed right-0 top-0 h-full w-80 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                        <X className="w-5 h-5 text-gray-600" />
                        </button>
                            <Button
                            variant="outline"
                            size="sm"
                            className="text-sm border-gray-300 hover:bg-gray-50"
                            onClick={() => {
                                onClose();
                                onConnectAnother?.();
                            }}
                        >
                            Connect another wallet
                        </Button>
                    </div>

                    <div className="flex-1 p-4 space-y-3">
                        {connectedWallets.map((wallet, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center">
                                        {
                                            wallet.type == "evm" ? (
                                                <img 
                                                    src={getWalletIcon(wallet.type)} 
                                                    alt={wallet.displayName} 
                                                    className="w-7 h-7 object-contain" 
                                                />
                                            ):(
                                                <img 
                                                    src={getWalletIcon(wallet.type)} 
                                                    alt={wallet.displayName} 
                                                    className="w-6 h-6 object-contain" 
                                                />
                                            )
                                        }
                                    </div>
                                    <div className='flex flex-col space-y-0.5'>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                            <span className="text-sm font-medium text-gray-900 cursor-help">
                                                {getWalletDisplayName(wallet)}
                                            </span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                            <p className="text-xs">{wallet.address}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <span className='text-xs text-gray-500'>${wallet.balance}</span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={() => handleCopyAddress(wallet.address)}
                                                className="p-1 hover:bg-gray-200 rounded transition-colors"
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
                                                className="p-1 hover:bg-red-100 rounded transition-colors"
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
                        ))}
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
