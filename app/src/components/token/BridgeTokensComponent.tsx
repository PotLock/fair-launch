"use client"

import { useState } from "react";
import { Token } from "@/types/api";
import { InputBridge } from "@/components/token/InputBridge"
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useWallet } from "@solana/wallet-adapter-react";
import { useBridge } from "@/hooks/useBridge";
import { ChainKind, normalizeAmount } from "omni-bridge-sdk";
import { SOL_NETWORK } from "@/configs/env.config";
import { useWalletContext } from "@/contexts/WalletProviderContext";

interface Chain {
    name: string;
    logo: string;
    address: string;
    balance?: number;
    userAddress: string;
    price: number;
    explorerUrl: string;
}

interface BridgeTokensComponentProps {
    token: Token;
    chains: Chain[];
    onClose: () => void;
    onBridgeProcessingStart: (amount: string, fromChain: string, toChain: string) => void;
    onBridgeProcessingComplete: (transactionHash: string) => void;
    onBridgeSuccessClose: () => void;
    onBridgeError: (errorMessage?: string) => void;
    onBridgeProgress?: (progress: number) => void;
}

export function BridgeTokensComponent({token, chains, onClose, onBridgeProcessingStart, onBridgeProcessingComplete, onBridgeError, onBridgeProgress}: BridgeTokensComponentProps){
    const [amount, setAmount] = useState<string|null>(null);
    const [isTransferring, setIsTransferring] = useState(false);

    const [selectedFromChain, setSelectedFromChain] = useState<Chain>(chains[0]);
    const [selectedToChain, setSelectedToChain] = useState<Chain>(chains[1]);

    // Wallet hooks
    const { signedAccountId, signIn } = useWalletSelector();
    const { connected, publicKey } = useWallet();
    const { transferToken } = useBridge();
    const { connectSolana } = useWalletContext();

    const handleFromChainChange = (chain: Chain) => {
        setSelectedFromChain(chain);
        if (selectedToChain && selectedToChain.name === chain.name) {
            const availableToChains = chains.filter(c => c.name !== chain.name);
            if (availableToChains.length > 0) {
                setSelectedToChain(availableToChains[0]);
            }
        }
    };

    const handleToChainChange = (chain: Chain) => {
        setSelectedToChain(chain);
        if (selectedFromChain && selectedFromChain.name === chain.name) {
            const availableFromChains = chains.filter(c => c.name !== chain.name);
            if (availableFromChains.length > 0) {
                setSelectedFromChain(availableFromChains[0]);
            }
        }
    };

    const handleBridgeToken = async () => {
        if (!token?.mintAddress) {
            toast.error('Please select a token first');
            return;
        }

        if(!signedAccountId){
            toast.error('Please connect your NEAR wallet first');
            signIn();
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (!connected || !publicKey) {
            toast.error('Please connect your Solana wallet first');
            connectSolana();
            return;
        }

        setIsTransferring(true);
        
        // Notify parent component to show processing modal
        onBridgeProcessingStart(amount, selectedFromChain.name, selectedToChain.name);
        
        try {
            const amountBigInt = BigInt(amount);
            const decimalsToChain = selectedToChain.name === 'NEAR' ? 24 : token.decimals;
            const normalizeedAmount = normalizeAmount(amountBigInt, token.decimals, decimalsToChain);
            const network = SOL_NETWORK == "devnet" ? "testnet" : "mainnet";
            const fromChain = selectedFromChain.name === 'NEAR' ? ChainKind.Near : ChainKind.Sol;
            const toChain = selectedToChain.name === 'NEAR' ? ChainKind.Near : ChainKind.Sol;
            const senderAddress = publicKey.toString();
            const result = await transferToken(
                network,
                fromChain,
                toChain,
                senderAddress,
                token.mintAddress, 
                normalizeedAmount, 
                signedAccountId,
                (progress: number) => {
                    onBridgeProgress?.(progress);
                }
            );
            
            setAmount('0');
            
            // Notify parent component to show success modal with transaction hashes
            onBridgeProcessingComplete(result||'');
        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : (typeof error === 'string' ? error : 'Unknown error');
            const cleanMessage = errorMessage.includes(':') ? errorMessage.split(':').pop()?.trim() : errorMessage;
            
            // Notify parent component with the clean error message
            onBridgeError(cleanMessage);
        } finally {
            setIsTransferring(false);
        }
    };

    return (
        <>
            <div className="space-y-4 overflow-y-auto max-h-[55vh]">
                <InputBridge
                    title="From"
                    token={token}
                    amount={amount ? Number(amount) : 0}
                    selectedChain={selectedFromChain}
                    chains={chains}
                    setAmount={(amount: number) => setAmount(String(amount))}
                    handleChainChange={handleFromChainChange}
                />
                <InputBridge
                    title="To"
                    token={token}
                    amount={amount ? Number(amount) : 0}
                    selectedChain={selectedToChain}
                    chains={chains}
                    setAmount={(amount: number) => setAmount(String(amount))}
                    handleChainChange={handleToChainChange}
                />
                <Card className="p-3 border-gray-200 w-full bg-[#475569]/10 shadow-none">
                    <div className="flex flex-col w-full gap-2 text-sm">
                        <div className="flex items-center justify-between md:gap-3 text-sm">
                            <span className="text-gray-600">Estimated Processing Time</span>
                            <span className="text-gray-800">~17s</span>
                        </div>
                        <div className="flex items-center justify-between md:gap-3 text-sm">
                            <span className="text-gray-600">Platform Fee</span>
                            <span className="text-gray-800">0.25%</span>
                        </div>
                    </div>
                </Card>
            </div>
            <div className="flex justify-end gap-3 mt-3">
                <Button
                    variant="outline"
                    onClick={onClose}
                    className="px-6 cursor-pointer border border-gray-200 shadow-none hover:text-gray-600 hover:bg-gray-100 bg-gray-50"
                    disabled={isTransferring}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleBridgeToken}
                    className="px-6 bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                    disabled={isTransferring}
                >
                    {isTransferring ? "Bridging..." : "Bridge Tokens"}
                </Button>
            </div>
        </>
    )
}