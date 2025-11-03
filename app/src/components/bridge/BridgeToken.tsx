"use client"

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { SelectTokenModal } from "@/components/modal/SelectTokenModal";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { SOL_NETWORK } from "@/configs/env.config";
import { getNearBalance } from "@/lib/near";
import { getSolBalance } from "@/lib/sol";
import { getBalanceEVM } from "@/lib/evm";
import { formatNumberInput, parseFormattedNumber } from "@/utils";
import { getAllBridgeTokens } from "@/lib/omni-bridge";
import { ChainKind, normalizeAmount } from "omni-bridge-sdk";
import { useBridge } from "@/hooks/useBridge";
import { useAccount } from "wagmi";
import { Transaction, Token, ChainType } from "@/types/bridge.types";
import { MIN_BALANCE, MIN_TARGET_BALANCE } from "@/constants/bridge.constants";
import { useChainTokens } from "@/hooks/useChainTokens";
import { TransactionHistory } from "./TransactionHistory";
import { ChainSection } from "./ChainSection";
import { TokenInput } from "./TokenInput";
import { BridgeInfoCard } from "./BridgeInfoCard";

export default function BridgeToken() {
    const { signedAccountId } = useWalletSelector();
    const { connected, publicKey } = useWallet();
    const { address: ethereumAddress } = useAccount();

    const { deployToken, transferToken } = useBridge();
    const { getTokensForChain, getLoadingStateForChain } = useChainTokens();

    const [amount, setAmount] = useState<string>('0');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isBridging, setIsBridging] = useState(false);
    const [bridgeProgress, setBridgeProgress] = useState(0);
    const [isTokenDeployedOnTargetChain, setIsTokenDeployedOnTargetChain] = useState(false);

    const [fromChain, setFromChain] = useState<ChainType>('solana');
    const [toChain, setToChain] = useState<ChainType>('near');

    const [selectedToken, setSelectedToken] = useState<Token>();
    const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
    const [tokenModalType, setTokenModalType] = useState<'from' | 'to'>('from');

    const getConnectedWallets = (): ChainType[] => {
        const connectedChains: ChainType[] = [];
        if (connected && publicKey) {
            connectedChains.push('solana');
        }
        if (signedAccountId) {
            connectedChains.push('near');
        }
        if (ethereumAddress) {
            connectedChains.push('ethereum');
        }
        return connectedChains;
    };

    useEffect(() => {
        const connectedWallets = getConnectedWallets();
        
        if (connectedWallets.length > 0) {
            if (connectedWallets.length === 1) {
                setFromChain(connectedWallets[0]);
            } else if (connectedWallets.length === 2) {
                if (connectedWallets.includes('solana')) {
                    setFromChain('solana');
                    const otherChain = connectedWallets.find(c => c !== 'solana');
                    if (otherChain) {
                        setToChain(otherChain);
                    }
                } else {
                    setFromChain(connectedWallets[0]);
                    setToChain(connectedWallets[1]);
                }
            } else if (connectedWallets.length === 3) {
                setFromChain('solana');
                setToChain('near');
            }
        }
    }, [connected, publicKey, signedAccountId, ethereumAddress]);

    // Helper functions
    const isFromChainWalletConnected = () => {
        switch (fromChain) {
            case 'near':
                return !!signedAccountId;
            case 'solana':
                return connected && publicKey;
            case 'ethereum':
                return !!ethereumAddress;
            default:
                return false;
        }
    };

    const isAmountExceedingBalance = () => {
        if (!selectedToken || !amount) return false;
        const inputAmount = parseFormattedNumber(amount);
        const tokenBalance = parseFloat(selectedToken.balance);
        return inputAmount > tokenBalance;
    };

    const getAvailableTokens = () => {
        if (!isFromChainWalletConnected()) {
            return [];
        }
        return getTokensForChain(fromChain);
    };

    const getIsLoadingFromChainTokens = () => {
        return getLoadingStateForChain(fromChain);
    };

    const getWalletAddress = (chain: ChainType): string | undefined => {
        switch (chain) {
            case 'solana':
                return publicKey?.toBase58();
            case 'near':
                return signedAccountId || undefined;
            case 'ethereum':
                return ethereumAddress ? ethereumAddress.toString() : undefined;
            default:
                return undefined;
        }
    };

    // Update selected token when chain changes or wallet connection status changes
    useEffect(() => {
        const availableTokens = getAvailableTokens();
        if (availableTokens.length > 0) {
            setSelectedToken(availableTokens[0]);
        } else {
            setSelectedToken(undefined);
        }
        setIsTokenDeployedOnTargetChain(false);
    }, [fromChain, connected, signedAccountId, ethereumAddress]);

    // Update selected token when tokens change
    useEffect(() => {
        if (isFromChainWalletConnected()) {
            const availableTokens = getAvailableTokens();
            if (availableTokens.length > 0 && !selectedToken) {
                setSelectedToken(availableTokens[0]);
            }
        }
    }, [getTokensForChain(fromChain).length, selectedToken]);

    const fetchBridgeTokens = useCallback(async () => {
        if (selectedToken) {
            const chainToken = fromChain === 'solana' ? ChainKind.Sol : ChainKind.Near;
            const addressTokenBridged = await getAllBridgeTokens(selectedToken.mint, chainToken, 'testnet')

            if (addressTokenBridged && addressTokenBridged.length > 0) {
                const targetChainAddress = addressTokenBridged.find(addr => {
                    const [chain] = addr.split(':');
                    return chain === toChain;
                });

                setIsTokenDeployedOnTargetChain(!!targetChainAddress);
            } else {
                setIsTokenDeployedOnTargetChain(false);
            }
        }
    }, [selectedToken, toChain])

    useEffect(() => {
        fetchBridgeTokens()
    }, [fetchBridgeTokens])

    useEffect(() => {
        setIsTokenDeployedOnTargetChain(false);
        if (selectedToken) {
            fetchBridgeTokens();
        }
    }, [toChain, fromChain]);

    const handleMaxAmount = () => {
        if (selectedToken) {
            const formattedBalance = formatNumberInput(selectedToken.balance);
            setAmount(formattedBalance);
        }
    };

    const handleHalfAmount = () => {
        if (selectedToken) {
            const currentAmount = parseFloat(selectedToken.balance) || 0;
            const halfAmount = (currentAmount * 0.5).toFixed(6);
            const formattedHalfAmount = formatNumberInput(halfAmount);
            setAmount(formattedHalfAmount);
        }
    };

    const checkBalance = (
        chain: "sol" | "near" | "eth",
        balance: number,
        minRequired: number
    ) => {
        if (balance < minRequired) {
            toast.error(
                `Insufficient balance to deploy token, balance need >= ${minRequired} ${chain.toUpperCase()}`
            );
            return false;
        }
        return true;
    };

    const handleBridge = async () => {
        if (!amount || parseFormattedNumber(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (!selectedToken) {
            toast.error('Please select a token');
            return;
        }

        if (!isFromChainWalletConnected()) {
            toast.error('Please connect your wallet first');
            return;
        }

        if (isAmountExceedingBalance()) {
            toast.error('Amount exceeds token balance');
            return;
        }

        setIsBridging(true);

        try {
            const network = SOL_NETWORK == "devnet" ? "testnet" : "mainnet";
            const amountBigInt = BigInt(parseFormattedNumber(amount)*Math.pow(10, selectedToken.decimals));
            const decimalsToChain = fromChain == "near" ? 24 : selectedToken.decimals;
            const amountToBridge = normalizeAmount(amountBigInt, selectedToken.decimals, decimalsToChain);

            const from = fromChain === 'near' ? ChainKind.Near : ChainKind.Sol;
            const to = toChain === 'near' ? ChainKind.Near : ChainKind.Sol;
            const senderAddress = fromChain === 'near' ? signedAccountId : publicKey?.toString();
            const recipientAddress = toChain === 'near' ? signedAccountId : publicKey?.toString();
            const result = await transferToken(
                network,
                from,
                to,
                senderAddress!,
                selectedToken.mint,
                amountToBridge,
                recipientAddress!
            );
            console.log("result", result)
        } catch (error) {
            console.error('Bridge error:', error);
            toast.error('Bridge failed. Please try again.');
            setIsBridging(false);
        } finally {
            setIsBridging(false)
        }
    };

    const handleDeployToken = async () => {
        if (!selectedToken) {
            toast.error('Please select a token');
            return;
        }

        if (!isFromChainWalletConnected()) {
            toast.error('Please connect your wallet first');
            return;
        }

        try {
            const solBalance = await getSolBalance(publicKey?.toBase58() || '')
            const nearBalance = await getNearBalance(signedAccountId || '')
            const ethBalance = await getBalanceEVM(ethereumAddress || '')

            if (fromChain === "solana") {
                if (!checkBalance("sol", Number(solBalance), MIN_BALANCE.sol)) return;
            } else if (fromChain === "near") {
                if (!checkBalance("near", Number(nearBalance), MIN_BALANCE.near)) return;
            } else if (fromChain === "ethereum") {
                if (!checkBalance("eth", Number(ethBalance), MIN_BALANCE.eth)) return;
            }

            if (toChain === "near") {
                if (!checkBalance("near", Number(nearBalance), MIN_TARGET_BALANCE.near)) return;
            } else if (toChain === "solana") {
                if (!checkBalance("sol", Number(solBalance), MIN_TARGET_BALANCE.sol)) return;
            } else if (toChain === "ethereum") {
                if (!checkBalance("eth", Number(ethBalance), MIN_TARGET_BALANCE.eth)) return;
            }

            const network = SOL_NETWORK == "devnet" ? "testnet" : "mainnet"
            const from = fromChain === 'solana' ? ChainKind.Sol : ChainKind.Near;
            const to = toChain === 'solana' ? ChainKind.Sol : ChainKind.Near;

            await deployToken(network, from, to, selectedToken.mint);
            toast.success('Deploy token successfully');

        } catch (error) {
            console.error("Deploy token error:", error);
            toast.error('Deploy token failed. Please try again.');
        }
    }

    const handleSwapChains = () => {
        const currentFromChain = fromChain;
        const currentToChain = toChain;
        setFromChain(currentToChain);
        setToChain(currentFromChain);
    };

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Bridge Tokens</h1>
                    <p className="text-gray-600 mt-2">Transfer tokens across different blockchain networks</p>
                </div>

                <div className="flex gap-6">
                    <TransactionHistory transactions={transactions} />

                    <div className="w-[478px]">
                        <Card className="bg-white border border-gray-200 rounded-xl p-5 shadow-none">
                            <div className="flex flex-col">
                                {/* From Section */}
                                <div className="space-y-2 mb-2">
                                    <h3 className="text-base font-medium text-gray-600">From</h3>
                                    <div className="border border-gray-200 rounded-lg p-3">
                                        <ChainSection
                                            chain={fromChain}
                                            onChainChange={setFromChain}
                                            walletAddress={getWalletAddress(fromChain)}
                                            label="Select source chain"
                                        />

                                        <TokenInput
                                            amount={amount}
                                            onAmountChange={setAmount}
                                            selectedToken={selectedToken}
                                            onTokenSelectClick={() => {
                                                setTokenModalType('from');
                                                setIsTokenModalOpen(true);
                                            }}
                                            onHalfAmount={handleHalfAmount}
                                            onMaxAmount={handleMaxAmount}
                                            chain={fromChain}
                                            isLoading={getIsLoadingFromChainTokens()}
                                            isDisabled={!isFromChainWalletConnected() || isBridging}
                                        />
                                    </div>
                                </div>

                                {/* Swap Button */}
                                <div className="flex justify-center cursor-pointer">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-8 h-8 rounded-full bg-gray-100 border-gray-200 hover:bg-red-500 cursor-pointer"
                                        onClick={handleSwapChains}
                                    >
                                        <ArrowUpDown className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* To Section */}
                                <div className="space-y-2 -mt-2">
                                    <h3 className="text-base font-medium text-gray-600">To</h3>
                                    <div className="border border-gray-200 rounded-lg p-3">
                                        <ChainSection
                                            chain={toChain}
                                            onChainChange={setToChain}
                                            walletAddress={getWalletAddress(toChain)}
                                            label="Select destination chain"
                                        />

                                        <TokenInput
                                            amount={amount}
                                            onAmountChange={setAmount}
                                            selectedToken={selectedToken}
                                            onTokenSelectClick={() => { }}
                                            onHalfAmount={handleHalfAmount}
                                            onMaxAmount={handleMaxAmount}
                                            chain={toChain}
                                            isLoading={getIsLoadingFromChainTokens()}
                                            isDisabled={true}
                                            isReadOnly={true}
                                        />
                                    </div>
                                </div>

                                <BridgeInfoCard />

                                <div className="mt-5">
                                    <Button
                                        onClick={isTokenDeployedOnTargetChain ? handleBridge : handleDeployToken}
                                        disabled={isBridging || !selectedToken || !isFromChainWalletConnected()}
                                        className="w-full bg-red-500 text-white hover:bg-red-600 cursor-pointer disabled:bg-red-400 disabled:text-white disabled:cursor-not-allowed"
                                    >
                                        {isBridging ? `Bridging... ${bridgeProgress}%` :
                                            isTokenDeployedOnTargetChain ? `Bridge ${selectedToken?.symbol || ''}` :
                                                `Deploy ${selectedToken?.symbol || ''} on ${toChain.toUpperCase()}`}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            <SelectTokenModal
                open={isTokenModalOpen}
                onOpenChange={setIsTokenModalOpen}
                tokens={getAvailableTokens()}
                isLoadingTokens={getIsLoadingFromChainTokens()}
                onTokenSelect={setSelectedToken}
                selectedToken={selectedToken}
                modalType={tokenModalType}
            />
        </div>
    );
}
