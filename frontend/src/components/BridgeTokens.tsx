import { useState } from "react";
import { Token } from "../types";
import { InputBridge } from "./InputBridge"
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { toast } from "react-hot-toast";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useWallet } from "@solana/wallet-adapter-react";
import { useBridge } from "../hook/useBridge";

interface Chain {
    name: string;
    logo: string;
    address: string;
    balance?: number;
    userAddress: string;
    price: number;
    explorerUrl: string;
}

interface BridgeTokensProps {
    tokenInfo: Token;
    chains: Chain[];
    onClose: () => void;
    onBridgeProcessingStart: (amount: string, fromChain: string, toChain: string) => void;
    onBridgeProcessingComplete: (transactionHash: string, transactionHashNear: string) => void;
    onBridgeSuccessClose: () => void;
    onBridgeError: () => void;
    onBridgeProgress?: (progress: number) => void;
}

export function BridgeTokens({tokenInfo, chains, onClose, onBridgeProcessingStart, onBridgeProcessingComplete, onBridgeError, onBridgeProgress}: BridgeTokensProps){
    const [amount, setAmount] = useState<string|null>(null);
    const [isTransferring, setIsTransferring] = useState(false);

    const [selectedFromChain, setSelectedFromChain] = useState<Chain>(chains[0]);
    const [selectedToChain, setSelectedToChain] = useState<Chain>(chains[1]);

    // Wallet hooks
    const { signedAccountId } = useWalletSelector();
    const { connected, publicKey } = useWallet();
    const { transferTokenSolanaToNear } = useBridge();

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
        if (!tokenInfo?.mintAddress) {
            toast.error('Please select a token first');
            return;
        }

        if(!signedAccountId){
            toast.error('Please connect your NEAR wallet first');
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (!connected || !publicKey) {
            toast.error('Please connect your Solana wallet first');
            return;
        }

        setIsTransferring(true);
        
        // Notify parent component to show processing modal
        onBridgeProcessingStart(amount, selectedFromChain.name, selectedToChain.name);
        
        try {
            // Convert amount to bigint (assuming 6 decimals for most tokens)
            const amountBigInt = BigInt(Math.floor(parseFloat(amount)*(10**6)));
            
            const result = await transferTokenSolanaToNear(
                tokenInfo.mintAddress, 
                amountBigInt, 
                signedAccountId,
                (progress: number) => {
                    // Pass progress to parent component
                    onBridgeProgress?.(progress);
                }
            );
            
            setAmount('0');
            
            // Notify parent component to show success modal with transaction hashes
            onBridgeProcessingComplete(result?.transactionHash || '', result?.transactionHashNear || '');
        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            // Extract only the main error message, not the full stack
            const cleanMessage = errorMessage.includes(':') ? errorMessage.split(':').pop()?.trim() : errorMessage;
            toast.error(`Bridge failed: ${cleanMessage}`);
            
            // Notify parent component to close processing modal and show error
            onBridgeError();
        } finally {
            setIsTransferring(false);
        }
    };

    return (
        <>
            <div className="space-y-4 overflow-y-auto max-h-[55vh]">
                <InputBridge
                    title="From"
                    tokenInfo={tokenInfo}
                    amount={Number(amount)}
                    selectedChain={selectedFromChain}
                    chains={chains}
                    setAmount={(amount: number) => setAmount(String(amount))}
                    handleChainChange={handleFromChainChange}
                />
                <InputBridge
                    title="To"
                    tokenInfo={tokenInfo}
                    amount={Number(amount)}
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
                    className="px-6"
                    disabled={isTransferring}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleBridgeToken}
                    className="px-6 bg-red-600 hover:bg-red-700 text-white"
                    disabled={isTransferring}
                >
                    {isTransferring ? "Bridging..." : "Bridge Tokens"}
                </Button>
            </div>
        </>
    )
}